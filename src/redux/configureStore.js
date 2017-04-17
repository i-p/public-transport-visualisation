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



const middleware = [thunk, waitForTransitData];

const storeEnhancers = [];

const middlewareEnhancer = applyMiddleware(...middleware);
storeEnhancers.unshift(middlewareEnhancer);

export default function configureStore(initialState) {
  const store = createStore(
    rootReducer,
    initialState,
    compose(...storeEnhancers)
  );

  if (module.hot) {
    module.hot.accept("./rootReducer", () =>
      store.replaceReducer(require("./rootReducer").default)
    );
  }

  return store;
}
