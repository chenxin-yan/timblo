import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type TAvailabilityInsert,
  type TAvailabilitySelect,
  type TEventInsert,
  type TEventSelect,
  type TResponseInsert,
  type TResponseSelect,
  type TResponseUpdate,
  ZAvailabilityInsertArray,
  ZAvailabilitySelect,
  ZEventInsert,
  ZEventSelect,
  ZEventUpdate,
  ZResponseInsert,
  ZResponseSelect,
  ZResponseUpdate,
} from "@timblo/api";
import hono from "@web/lib/api";
import { toast } from "sonner";
import { z } from "zod";
import { zonedTimeToAvailabilityUTC } from "./timezone.utils";

// Keys for the queries
export const eventKeys = {
  all: ["events"] as const,
  detail: (id: string) => [...eventKeys.all, "detail", id] as const,
  responses: (id: string) => [...eventKeys.all, "responses", id] as const,
  availability: (id: string) => [...eventKeys.all, "availability", id] as const,
};

// Fetchers
const fetchEventById = async (eventId: string): Promise<TEventSelect> => {
  const res = await hono.api.events[":eventId"].$get({
    param: { eventId },
  });

  if (!res.ok) {
    throw new Error("Failed to load event data");
  }

  const data = await res.json();
  return ZEventSelect.parse(data);
};

const fetchEventResponses = async (
  eventId: string,
): Promise<TResponseSelect[]> => {
  const res = await hono.api.events[":eventId"].responses.$get({
    param: { eventId },
  });

  if (!res.ok) {
    throw new Error("Failed to load responses data");
  }

  const data = await res.json();
  const ResponseArraySchema = z.array(ZResponseSelect);
  return ResponseArraySchema.parse(data);
};

const fetchEventAvailability = async (
  eventId: string,
): Promise<TAvailabilitySelect[]> => {
  const res = await hono.api.events[":eventId"].availability.$get({
    param: { eventId },
  });

  if (!res.ok) {
    throw new Error("Failed to load availability data");
  }

  const data = await res.json();
  const AvailabilityArraySchema = z.array(ZAvailabilitySelect);
  return AvailabilityArraySchema.parse(data);
};

// Queries
export const useEvent = (eventId: string) => {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => fetchEventById(eventId),
    retry: 1,
  });
};

export const useEventResponses = (eventId: string) => {
  return useQuery({
    queryKey: eventKeys.responses(eventId),
    queryFn: () => fetchEventResponses(eventId),
    retry: 1,
  });
};

export const useEventAvailability = (eventId: string) => {
  return useQuery({
    queryKey: eventKeys.availability(eventId),
    queryFn: () => fetchEventAvailability(eventId),
    retry: 1,
  });
};

// Combined query to fetch all event data at once
export const useEventFullData = (eventId: string) => {
  const eventQuery = useEvent(eventId);
  const responsesQuery = useEventResponses(eventId);
  const availabilityQuery = useEventAvailability(eventId);

  return {
    event: eventQuery.data,
    responses: responsesQuery.data ?? [],
    availability: availabilityQuery.data ?? [],
    isLoading:
      eventQuery.isLoading ||
      responsesQuery.isLoading ||
      availabilityQuery.isLoading,
    isError:
      eventQuery.isError || responsesQuery.isError || availabilityQuery.isError,
    error: eventQuery.error || responsesQuery.error || availabilityQuery.error,
    refetch: async () => {
      await Promise.all([
        eventQuery.refetch(),
        responsesQuery.refetch(),
        availabilityQuery.refetch(),
      ]);
    },
  };
};

// Mutations
interface AddResponse extends TResponseInsert {
  availability: TAvailabilityInsert[];
  timezone: string;
}

export const useAddResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      name,
      email,
      availability,
      timezone,
    }: AddResponse) => {
      // Convert availability back to UTC
      const newAvailability = ZAvailabilityInsertArray.parse(
        zonedTimeToAvailabilityUTC(availability, timezone),
      );

      // Create new response
      const newResponse = ZResponseInsert.parse({
        eventId,
        name,
        email,
      });

      const responseRes = await hono.api.responses.$post({
        json: newResponse,
      });

      if (responseRes.status === 409) {
        const err = await responseRes.json();
        throw new Error(err.message);
      }

      if (!responseRes.ok) {
        throw new Error("Failed to add response. Please try again.");
      }

      const { id: responseId } = await responseRes.json();

      // Add availability for new response
      const availabilityRes = await hono.api.responses[
        ":responseId"
      ].availability.$post({
        param: { responseId },
        json: newAvailability,
      });

      if (!availabilityRes.ok) {
        throw new Error("Failed to add availability. Please try again.");
      }

      return { responseId };
    },
    onSuccess: (_, { eventId }) => {
      toast.success("Response added successfully!");
      queryClient.invalidateQueries({ queryKey: eventKeys.responses(eventId) });
      queryClient.invalidateQueries({
        queryKey: eventKeys.availability(eventId),
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

interface UpdateResponse extends TResponseUpdate {
  responseId: string;
  eventId: string;
  availability: TAvailabilityInsert[];
  timezone: string;
}

export const useUpdateResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      responseId,
      name,
      email,
      availability,
      timezone,
    }: UpdateResponse) => {
      // Convert availability back to UTC
      const newAvailability = ZAvailabilityInsertArray.parse(
        zonedTimeToAvailabilityUTC(availability, timezone),
      );

      const updateResponse = ZResponseUpdate.parse({
        name,
        email,
      });

      const responseRes = await hono.api.responses[":responseId"].$put({
        param: { responseId },
        json: updateResponse,
      });

      if (!responseRes.ok) {
        throw new Error("Failed to update response. Please try again.");
      }

      // Update availability for existing response
      const availabilityRes = await hono.api.responses[
        ":responseId"
      ].availability.$put({
        param: { responseId },
        json: newAvailability,
      });

      if (!availabilityRes.ok) {
        throw new Error("Failed to update availability. Please try again.");
      }

      return { responseId };
    },
    onSuccess: (_, { eventId }) => {
      toast.success("Response updated successfully!");
      queryClient.invalidateQueries({ queryKey: eventKeys.responses(eventId) });
      queryClient.invalidateQueries({
        queryKey: eventKeys.availability(eventId),
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      responseId,
      eventId,
    }: { responseId: string; eventId: string }) => {
      const response = await hono.api.responses[":responseId"].$delete({
        param: { responseId },
      });

      if (!response.ok) {
        throw new Error("Failed to delete response. Please try again.");
      }

      return { responseId, eventId };
    },
    onSuccess: (_, { eventId }) => {
      toast.success("Response deleted successfully");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: eventKeys.responses(eventId) });
      queryClient.invalidateQueries({
        queryKey: eventKeys.availability(eventId),
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: TEventInsert) => {
      const newEvent = ZEventInsert.parse(event);

      const res = await hono.api.events.$post({
        json: newEvent,
      });

      if (!res.ok) {
        throw new Error("Failed to create event. Please try again.");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Event created successfully!");
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

// For updating existing events
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      event,
    }: { eventId: string; event: TEventInsert }) => {
      const newEvent = ZEventUpdate.parse(event);

      const res = await hono.api.events[":eventId"].$put({
        param: { eventId },
        json: newEvent,
      });

      if (!res.ok) {
        throw new Error("Failed to update event. Please try again.");
      }

      return res.json();
    },
    onSuccess: (_, { eventId }) => {
      toast.success("Event updated successfully!");
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
