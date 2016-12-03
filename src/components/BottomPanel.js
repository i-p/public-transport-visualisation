import React from "react"
import { connect } from "react-redux"
import _ from "lodash"
import * as utils from "../utils"
import classNames from "classnames"

class BottomPanelComponent extends React.Component {
  constructor(props) {
    super(props);
    this.onMouseMove = this.onMouseMove.bind(this);
    this._lastSecondOfDay = 0;
    this.state = { speedSelectorVisible: false };
  }
  componentDidMount() {
    document.addEventListener("mousemove", this.onMouseMove);
  }
  componentWillUnmount() {
    document.removeEventListener("mousemove", this.onMouseMove);
  }
  _shouldUpdateTimeline(currentTime) {
    let sec = utils.toSecondsOfDay(currentTime);

    if (Math.abs(sec - this._lastSecondOfDay) > 30) {
      this._lastSecondOfDay = sec;
      return true;
    }
    return false;
  }
  shouldComponentUpdate(nextProps, nextState) {
    let {speed, direction} = this.props;

    if (nextProps.speed !== speed
      || nextProps.direction !== direction
      || this._shouldUpdateTimeline(nextProps.time)
      || this.refs.svg.clientWidth !== this.width
      || nextState.speedSelectorVisible !== this.state.speedSelectorVisible) {
      return true;
    }

    this.refs.timeString.textContent = utils.formatTimeAsHMS(nextProps.time);
    return false;
  }
  setDirection(direction) {
    this.props.setDirection(direction);
  }

  toggleSpeedSelector() {
    this.setState({ speedSelectorVisible: !this.state.speedSelectorVisible });
  }

  changeSpeed(newSpeed) {
    this.props.setSpeed(newSpeed);
    this.setState({ speedSelectorVisible: false });
  }

  render() {
    let {time} = this.props;

    const sec = utils.toSecondsOfDay(time);
    const timeString = utils.formatTimeAsHMS(time);

    let width = null;
    let height = null;
    if (this.refs.svg) {
      width = this.width = this.refs.svg.clientWidth;
      height = this.height = this.refs.svg.clientHeight;
    }

    let x = (width * sec / 24 / 3600);
    return <div className="time-panel">
              <div ref="timeString" className="time">
                {timeString}
              </div>
              <div className="modes">
                <button className={classNames({active: this.props.direction == -1 })} onClick={()=>this.setDirection(-1)}>&lt;</button>
                <button className={classNames({active: this.props.direction == 0 })} onClick={()=>this.setDirection(0)}>||</button>
                <button className={classNames({active: this.props.direction == 1 })} onClick={()=>this.setDirection(1)}>&gt;</button>
              </div>
              <div className="speed">
                <div className={classNames({"speed-selector": true, "speed-selector-visible": this.state.speedSelectorVisible })}>
                  <SpeedButton speed={20} currentSpeed={this.props.speed} onClick={(s) => this.changeSpeed(s)}/>
                  <SpeedButton speed={10} currentSpeed={this.props.speed} onClick={(s) => this.changeSpeed(s)}/>
                  <SpeedButton speed={5} currentSpeed={this.props.speed} onClick={(s) => this.changeSpeed(s)}/>
                  <SpeedButton speed={1} currentSpeed={this.props.speed} onClick={(s) => this.changeSpeed(s)}/>
                </div>
                <div className="speed-current">
                  <button onClick={() => this.toggleSpeedSelector()}>
                    {
                      this.state.speedSelectorVisible ? "^" : this.props.speed + "x"
                    }
                  </button>
                </div>
              </div>
              <svg className="timeline" height="30"
                   preserveAspectRatio="none" ref="svg"
                   onMouseMove={(e) => this.onMouseMove(e)}
                   onMouseDown={(e) => this.onMouseDown(e)}
                   onMouseUp={(e) => this.onMouseUp(e)}>
                {this.renderGridlines(width,height)}
                {this.renderTimeLabels(width,height)}

                <rect className="timeline-marker" x="0" y="0"
                      width={x} height="30"/>
                <rect className="timeline-marker2" x={x - 2} y="0"
                      width="4" height="30"/>
              </svg>
          </div>
  }
  onMouseDown(e) {
    this.moving = true;
    if (this.width) {
      this.updateTime(e, this.width);
    }
  }
  onMouseMove(e) {
    if (this.moving && this.width) {
      e.preventDefault();
      this.updateTime(e, this.width);
    }
  }
  onMouseUp(e) {
    this.moving = false
  }
  updateTime(e, width) {
    const offsetX = e.clientX - this.refs.svg.getBoundingClientRect().left;

    let sec = offsetX / width * 24 * 3600;

    this.props.setTime(sec);
  }
  renderGridlines(width, height) {
    if (width && height) {
      let x = width / 24;

      let result = new Array(24 * 2);

      for (let i=0; i<24; i++) {
        result[2*i] = <line key={2*i} x1={x*i} y1={0} x2={x*i} y2={5} stroke="black" />;
        result[2*i + 1] = <line key={2*i + 1} x1={x*i} y1={25} x2={x*i} y2={30} stroke="black" />;
      }

      return result;
    } else {
      return [];
    }
  }
  renderTimeLabels(width, height) {
    if (width && height) {
      let maxElements = Math.floor(width / (4*12));
      let hoursToDisplay = _.find([24, 12, 8, 6, 4, 3], (n) => n < maxElements);

      let x = width / 24;

      let hourLabels = [];

      for (let i=0; i<=24;i+=24/hoursToDisplay) {
        hourLabels.push(<text key={i} x={i*x} y={21}>{i + ":00"}</text>)
      }

      return hourLabels;
    } else {
      return [];
    }
  }
}

let SpeedButton = ({currentSpeed, speed, onClick}) => {
  return <button onClick={() => onClick(speed)}>{speed + "x"}</button>;
};


export default connect((state) => ({time: state.time, speed: state.speed.speed, direction: state.speed.direction }), (dispatch) => ({
  setTime: (sec) => dispatch({ type: "SELECT_STOP_TIME",
                               stopTime: { arrivalTime: sec }}),
  setSpeed: (speed) => dispatch({type: "SET_SPEED", speed}),
  setDirection: (direction) => dispatch({type: "SET_DIRECTION", direction})
}))(BottomPanelComponent);
