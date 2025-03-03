import { Component, For } from "solid-js";
import styles from "./Settings.module.css";

interface ColorPaletteProps {
  selectedColor: () => string;
  setSelectedColor: (color: string) => void;
  colors: string[];
}

export const ColorPalette: Component<ColorPaletteProps> = (props) => {
  return (
    <div class={styles.colorPalette}>
      <For each={props.colors}>
        {(color) => (
          <div
            class={`${styles.colorOption} ${
              color === props.selectedColor() ? styles.selected : ""
            }`}
            style={{ "background-color": color }}
            onClick={() => props.setSelectedColor(color)}
          />
        )}
      </For>
    </div>
  );
};
