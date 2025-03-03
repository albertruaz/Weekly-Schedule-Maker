import { Component } from "solid-js";
import styles from "./Settings.module.css";

export type TimeFormat = "24h" | "12h" | "korean" | "simple";

interface TimeFormatControlProps {
  format: () => TimeFormat;
  setFormat: (format: TimeFormat) => void;
}

export const TimeFormatControl: Component<TimeFormatControlProps> = (props) => {
  const formats = {
    "24h": "09:00~14:00",
    "12h": "9:00~2:00",
    korean: "오전 9시 ~ 오후 2시 30분",
    simple: "9시 00분 ~ 2시 30분",
  };

  return (
    <div class={styles.timeFormatControl}>
      <select
        value={props.format()}
        onChange={(e) => props.setFormat(e.target.value as TimeFormat)}
      >
        <option value="24h">{formats["24h"]}</option>
        <option value="12h">{formats["12h"]}</option>
        <option value="korean">{formats["korean"]}</option>
        <option value="simple">{formats["simple"]}</option>
      </select>
    </div>
  );
};
