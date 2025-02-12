import mitt, { Emitter } from "mitt";

import { WordProps } from "./data";

type Events = {
    selectAllIdenticalWords: WordProps;
};
  
export const eventBus: Emitter<Events> = mitt<Events>();
