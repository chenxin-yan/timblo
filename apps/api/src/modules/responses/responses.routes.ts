import { createRouter } from "@api/lib/app";
import {
  createNewAvailability,
  deleteAvailabilityByResponse,
} from "../availability";
import {
  addAvailabilityToResponseRoute,
  createResponseRoute,
  deleteResponseRoute,
  getResponseByIdRoute,
  updateResponseAvailabilityRoute,
  updateResponseRoute,
} from "./responses.doc";
import {
  createNewResponse,
  deleteResponseById,
  getResponseById,
  updateResponseById,
} from "./responses.service";

const responseRoutes = createRouter()
  .openapi(createResponseRoute, async (c) => {
    const response = c.req.valid("json");
    const newResponse = await createNewResponse(c.env, response);
    return c.json(newResponse, 201);
  })
  .openapi(getResponseByIdRoute, async (c) => {
    const responseId = c.req.param("responseId");
    const response = await getResponseById(c.env, responseId);
    return c.json(response, 200);
  })
  .openapi(updateResponseRoute, async (c) => {
    const responseId = c.req.param("responseId");
    const newResponse = c.req.valid("json");
    const response = await updateResponseById(c.env, responseId, newResponse);
    return c.json(response, 200);
  })
  .openapi(deleteResponseRoute, async (c) => {
    const responseId = c.req.param("responseId");
    await deleteResponseById(c.env, responseId);
    return c.text("", 200);
  })
  .openapi(addAvailabilityToResponseRoute, async (c) => {
    const responseId = c.req.param("responseId");
    const availability = c.req.valid("json");
    const newAvailability = await createNewAvailability(
      c.env,
      responseId,
      availability,
    );
    return c.json(newAvailability, 201);
  })
  .openapi(updateResponseAvailabilityRoute, async (c) => {
    const responseId = c.req.param("responseId");
    const availability = c.req.valid("json");
    await deleteAvailabilityByResponse(c.env, responseId);
    const newAvailability = await createNewAvailability(
      c.env,
      responseId,
      availability,
    );

    return c.json(newAvailability, 200);
  });

export default responseRoutes;
