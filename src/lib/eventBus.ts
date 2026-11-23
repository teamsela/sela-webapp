import mitt, { Emitter } from "mitt";

import { WordProps } from "./data";

type Events = {
    selectAllIdenticalWords: WordProps;
    // A classroom was created, renamed or deleted; the sidebar list should refresh.
    classroomsChanged: undefined;
};
  
export const eventBus: Emitter<Events> = mitt<Events>();
