import { Component } from "solid-js";
import { AlignmentControl } from "./AlignmentControl";
import { ColorPalette } from "./ColorPalette";
import { TimeRangeControl } from "./TimeRangeControl";
import { DayControl } from "./DayControl";
import { TimeFormatControl, type TimeFormat } from "./TimeFormatControl";
import styles from "./Settings.module.css";

type TextAlign = "left" | "center" | "right";

interface SettingsProps {
  titleAlign: () => TextAlign;
  timeAlign: () => TextAlign;
  textAlign: () => TextAlign;
  setTitleAlign: (align: TextAlign) => void;
  setTimeAlign: (align: TextAlign) => void;
  setTextAlign: (align: TextAlign) => void;
  selectedColor: () => string;
  setSelectedColor: (color: string) => void;
  colors: string[];
  startHour: () => number;
  endHour: () => number;
  setStartHour: (hour: number) => void;
  setEndHour: (hour: number) => void;
  activeDays: () => number[];
  setActiveDays: (days: number[]) => void;
  timeFormat: () => TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  onSave: () => void;
  onLoad: (event: Event) => void;
  onDownloadPDF: () => void;
}

export const Settings: Component<SettingsProps> = (props) => {
  return (
    <div class={styles.settingsContainer}>
      <h2 class={styles.settingsTitle}>수정 모드 설정</h2>
      <div class={styles.settingsSection}>
        <h3>시간표 설정</h3>
        <TimeRangeControl
          startHour={props.startHour}
          endHour={props.endHour}
          setStartHour={props.setStartHour}
          setEndHour={props.setEndHour}
        />
        <DayControl
          activeDays={props.activeDays}
          setActiveDays={props.setActiveDays}
        />
      </div>

      <div class={styles.settingsSection}>
        <h3>일정 설정</h3>
        <AlignmentControl
          titleAlign={props.titleAlign}
          timeAlign={props.timeAlign}
          textAlign={props.textAlign}
          setTitleAlign={props.setTitleAlign}
          setTimeAlign={props.setTimeAlign}
          setTextAlign={props.setTextAlign}
        />
        <TimeFormatControl
          format={props.timeFormat}
          setFormat={props.setTimeFormat}
        />
      </div>

      <div class={styles.settingsSection}>
        <h3>색상</h3>
        <ColorPalette
          selectedColor={props.selectedColor}
          setSelectedColor={props.setSelectedColor}
          colors={props.colors}
        />
      </div>
    </div>
  );
};
