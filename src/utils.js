import Cesium from "cesium"
import _ from "lodash"

export const toAbsTime = (startTime, relativeTime) => {
  let localDate = Cesium.JulianDate.toDate(startTime);

  let newLocalDate = new Date(localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    Math.floor(relativeTime / 3600),
    Math.floor((relativeTime % 3600) / 60),
    Math.floor(relativeTime % 60));

  return Cesium.JulianDate.fromDate(newLocalDate);
}

export function secondsOfDayToHMS(secondsOfDay) {
  const hours = (secondsOfDay / 3600) | 0;
  const minutes = (secondsOfDay % 3600) / 60;
  const seconds = secondsOfDay % 60;
  return [hours, minutes, seconds];
}

export function formatSecondsOfDay(secondsOfDay) {
  let [h,m] = secondsOfDayToHMS(secondsOfDay);
  return `${h}:${_.padStart(m, 2, "0")}`;
}

export function toSecondsOfDay(time) {
  let d = Cesium.JulianDate.toDate(time);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

export function relativePosition(value, from, to) {
  return (value - from) / (to - from);
}

export function secondsOfDayToDate(day, secondsOfDay) {
  let localDate = Cesium.JulianDate.toDate(day);

  let newLocalDate = new Date(localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    ...secondsOfDayToHMS(secondsOfDay));

  return Cesium.JulianDate.fromDate(newLocalDate);
}

export function formatTimeAsHMS(time) {
  const date = Cesium.JulianDate.toDate(time);

  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();

  return h + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
}

