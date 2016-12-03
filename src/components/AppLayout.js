require('normalize.css/normalize.css');
require('styles/App.scss');

import React from "react"
import BottomPanel from "./BottomPanel"
import AppContainer from "./Main"
import InfoPanel from "./InfoPanel"

class AppLayout extends React.Component {
  constructor() {
    super()
  }

  componentDidMount() {
  }

  render() {
    return <div>
      <div className="viewer">
        <div id="cesiumContainer"></div>
        <BottomPanel/>
        <div id="credits"></div>
      </div>
      <aside id="panel">
        <InfoPanel/>
        <AppContainer/>
      </aside>
    </div>;
  }
}

export default AppLayout
