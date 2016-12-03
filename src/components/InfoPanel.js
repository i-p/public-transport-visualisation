import React from "react"

class InfoPanelComponent extends React.Component {
  constructor() {
    super();
  }
  render() {
    return <div className="info-panel">
      <div className="app-title">BRATISLAVA</div>
      <div className="app-subtitle">PUBLIC TRANSPORT VISUALISATION</div>
    </div>
  }
}

export default InfoPanelComponent;
