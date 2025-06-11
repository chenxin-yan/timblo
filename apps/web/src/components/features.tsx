import { Calendar, Globe, Users } from "lucide-react";

function Feature() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-3 lg:grid-cols-1 lg:pl-0">
        <div className="flex flex-row items-start gap-4">
          <Calendar className="mt-1 h-5 w-5 text-primary" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">Easy scheduling</p>
            <p className="text-muted-foreground text-sm">
              Create events in seconds and invite your group with a single link.
            </p>
          </div>
        </div>
        <div className="flex flex-row items-start gap-4">
          <Globe className="mt-1 h-5 w-5 text-primary" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">Timezone friendly</p>
            <p className="text-muted-foreground text-sm">
              Automatically adjusts for everyone, no matter where they are.
            </p>
          </div>
        </div>
        <div className="flex flex-row items-start gap-4">
          <Users className="mt-1 h-5 w-5 text-primary" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">Smart availability</p>
            <p className="text-muted-foreground text-sm">
              Find the perfect time when everyone can meet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature };
