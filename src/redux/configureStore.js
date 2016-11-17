import { createStore, applyMiddleware, compose } from "redux";
import rootReducer from "./rootReducer";
import thunk from "redux-thunk";

const middleware = [thunk];

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
    module.hot.accept("./root-reducer", () =>
      store.replaceReducer(require("./root-reducer").default)
    );
  }

  return store;
}
