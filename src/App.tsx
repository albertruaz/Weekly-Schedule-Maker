import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import "./App.css";
import WeeklySchedule from "./components/WeeklySchedule/WeeklySchedule";

function App() {
  const [showWeeklySchedule, setShowWeeklySchedule] = createSignal(false);

  return (
    <div class="app-container">
      {!showWeeklySchedule() ? (
        <div class="home-container">
          <h1>Home Page</h1>
          <p>버튼을 클릭하여 주간 시간표를 확인하세요.</p>
          <button
            class="schedule-btn"
            onClick={() => setShowWeeklySchedule(true)}
          >
            시간표 보기
          </button>
        </div>
      ) : (
        <div class="schedule-page">
          <button class="back-btn" onClick={() => setShowWeeklySchedule(false)}>
            ← 홈으로 돌아가기
          </button>
          <WeeklySchedule />
        </div>
      )}
    </div>
  );
}

export default App;
