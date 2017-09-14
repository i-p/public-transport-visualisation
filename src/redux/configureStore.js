import { createStore, applyMiddleware, compose } from "redux";
import rootReducer from "./rootReducer";
import thunk from "redux-thunk";


const waitForTransitData = store => next => {
  let queuedActions = [];
  let transitDataSet = false;

  return action => {
    if (transitDataSet) {
      return next(action);
    } else if (action.type === "SET_TRANSIT_DATA") {
      next(action);

      queuedActions.forEach(next);
      queuedActions = [];
      transitDataSet = true;
    } else {
      queuedActions.push(action);
    }
  };
};



const defaultMiddleware = [thunk, waitForTransitData];

const storeEnhancers = [];

const middlewareEnhancer = applyMiddleware(...defaultMiddleware);
storeEnhancers.unshift(middlewareEnhancer);

export default function configureStore(initialState, middleware = defaultMiddleware) {
  const store = createStore(
    rootReducer,
    initialState,
    applyMiddleware(...middleware)
  );

  if (module.hot) {
    module.hot.accept("./rootReducer", () =>
      store.replaceReducer(require("./rootReducer").default)
    );
  }

  return store;
}
