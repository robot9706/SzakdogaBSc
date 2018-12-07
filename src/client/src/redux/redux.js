import { createStore, combineReducers } from "redux";

import { user } from "./user";

const reduxRoot = combineReducers({
    user: user 
});

export function createReduxStore() {
    return createStore(reduxRoot);
}