"use client";

import { useState, useEffect, useRef } from "react";
import "./timer.css";

// 将时长s转换为分钟和秒
function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const paddingMinutes = minutes < 10 ? "0" : "";
  const paddingSeconds = seconds < 10 ? "0" : "";
  return `${paddingMinutes}${minutes}:${paddingSeconds}${seconds}`;
}

// 1. 一个计时器设置组件，用于设置呼吸练习的时间；
type TimerSettingProps = {
  breathParams: BreathParams;
  updateBreathParams: (params: BreathParams) => void;
  setIsStarted: (isStarted: boolean) => void;
};
function TimerSetting({
  breathParams,
  updateBreathParams,
  setIsStarted,
}: TimerSettingProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    const inhaleTime = data.get("inhaleTime");
    const exhaleTime = data.get("exhaleTime");
    const trainingTime = data.get("trainingTime");

    updateBreathParams({
      inhaleTime: Number(inhaleTime),
      exhaleTime: Number(exhaleTime),
      trainingTime: Number(trainingTime),
    });
    setIsStarted(true);
  }

  return (
    <form onSubmit={handleSubmit} className="setting-form">
      <p className="setting-item">
        <label>
          吸气时长(秒)：
          <input
            name="inhaleTime"
            type="number"
            placeholder="吸气时长"
            defaultValue={breathParams.inhaleTime}
          />
        </label>
      </p>
      <p className="setting-item">
        <label>
          呼气时长(秒)：
          <input
            name="exhaleTime"
            type="number"
            placeholder="呼气时长"
            defaultValue={breathParams.exhaleTime}
          />
        </label>
      </p>
      <p className="setting-item">
        <label>
          练习时长(分)：
          <input
            name="trainingTime"
            type="number"
            placeholder="练习时长"
            defaultValue={breathParams.trainingTime}
          />
        </label>
      </p>
      <button type="submit" className="operation-button operation-button-start">
        开 始
      </button>
    </form>
  );
}

// 2. 一个计时器组件，用于显示呼吸练习的时间；
type TimerProps = {
  breathParams: BreathParams;
  breathStatus: "inhale" | "exhale";
  exercisedTime: number;
  currentDuration: number;
  isNextSwitch: boolean;
  setIsStarted: (isStarted: boolean) => void;
};
function Timer({
  breathParams,
  breathStatus,
  currentDuration,
  exercisedTime,
  isNextSwitch,
  setIsStarted,
}: TimerProps) {
  function handleEnd() {
    setIsStarted(false);
  }

  return (
    <div className="realtime-timer">
      <p className="info-item info-item-setting">
        呼气：{breathParams.exhaleTime}秒，吸气：{breathParams.inhaleTime}
        秒，时长：{breathParams.trainingTime}分钟
      </p>
      <p className="info-item">
        用时：<span className="use-time">{formatTime(exercisedTime)}</span>
      </p>
      <p className="info-item info-item-breath-status">
        {breathStatus === "inhale" ? "吸气" : "吐气"}
      </p>
      <p className="info-item info-item-duration">{currentDuration}</p>
      {/* {isNextSwitch && <p className="info-item info-item-switch">即将切换</p>} */}
      {/* 结束按钮 */}
      <button
        className="operation-button operation-button-stop"
        onClick={handleEnd}
      >
        结 束
      </button>
    </div>
  );
}

type BreathParams = {
  inhaleTime?: number;  // 吸气时长
  exhaleTime?: number;  // 呼气时长
  trainingTime?: number;  // 练习时长
};

export default function BreathExerciseTimer() {
  // 是否开始呼吸练习，用于切换设置和计时器组件
  const [isStarted, setIsStarted] = useState(false);
  // 标识是否完成呼吸练习
  const [isFinished, setIsFinished] = useState(false);

  // 呼吸状态 breathStatus
  const [breathStatus, setBreathStatus] = useState<"inhale" | "exhale">(
    "inhale"
  );

  // 呼吸参数
  const [breathParams, setBreathParams] = useState({
    inhaleTime: 5,
    exhaleTime: 5,
    trainingTime: 3,
  });

  // 更新呼吸参数
  const updateBreathParams = (newParams: BreathParams) => {
    setBreathParams((prevParams) => ({
      ...prevParams,
      ...newParams,
    }));
  };

  // 读取本地存储的呼吸参数
  function readBreathParams() {
    const params = localStorage.getItem("breathParams");
    if (params) {
      setBreathParams(JSON.parse(params));
    }
  }
  useEffect(() => {
    readBreathParams();
  }, []);

  // 保存呼吸参数到本地存储
  function saveBreathParams() {
    localStorage.setItem("breathParams", JSON.stringify(breathParams));
  }

  // 实际计时的总呼吸练习时长
  const [exercisedTime, setExercisedTime] = useState(0);
  // 本轮呼吸的计时时间
  const [currentDuration, setCurrentDuration] = useState(0);

  // 计时定时器
  const [timer, setTimer] = useState<NodeJS.Timeout>();

  const breathStatusRef = useRef(breathStatus);
  const currentDurationRef = useRef(currentDuration);
  const exercisedTimeRef = useRef(exercisedTime);

  useEffect(() => {
    breathStatusRef.current = breathStatus;
  }, [breathStatus]);
  useEffect(() => {
    currentDurationRef.current = currentDuration;
  }, [currentDuration]);
  useEffect(() => {
    exercisedTimeRef.current = exercisedTime;
  }, [exercisedTime]);

  // 监听开始呼吸练习，则开始计时，从设置的时间开始，每秒更新一次
  useEffect(() => {
    // 这里的代码会在 isStarted 状态变化时执行
    if (isStarted) {
      // 如果 isStarted 为 true，执行相应的操作
      setIsFinished(false);

      setExercisedTime(0);
      setBreathStatus("inhale");
      setCurrentDuration(breathParams.inhaleTime);

      saveBreathParams();

      const _timer = setInterval(() => {
        // 如果当前练习时长大于等于设置的练习时长，且当前呼吸状态为 exhale，且当前呼气时长大于等于设置的呼气时长，结束计时
        if (
          exercisedTimeRef.current >= breathParams.trainingTime * 60 &&
          breathStatusRef.current === "exhale" &&
          currentDurationRef.current <= 0
        ) {
          clearInterval(timer);
          setIsFinished(true);
          setIsStarted(false);
          return;
        }

        // 如果当前呼吸状态为 exhale，且当前呼气时长未达到设置的呼气时长，继续呼气
        if (
          breathStatusRef.current === "exhale" &&
          currentDurationRef.current > 1
        ) {
          setCurrentDuration((prevCurrentDuration) => prevCurrentDuration - 1);
          setExercisedTime((prevExercisedTime) => prevExercisedTime + 1);
        } else if (
          breathStatusRef.current === "exhale" &&
          currentDurationRef.current <= 1
        ) {
          // 如果当前呼气时长小于等于1，切换为 inhale，当前时长设置为吸气时长
          setBreathStatus("inhale");
          setCurrentDuration(breathParams.inhaleTime);
          setExercisedTime((prevExercisedTime) => prevExercisedTime + 1);
        } else if (
          breathStatusRef.current === "inhale" &&
          currentDurationRef.current > 1
        ) {
          // 如果当前吸气时长未达到设置的吸气时长，继续吸气
          setCurrentDuration((prevCurrentDuration) => prevCurrentDuration - 1);
          setExercisedTime((prevExercisedTime) => prevExercisedTime + 1);
        } else if (
          breathStatusRef.current === "inhale" &&
          currentDurationRef.current <= 1
        ) {
          // 如果当前吸气时长小于等于1，切换为 exhale，当前时长设置为呼气时长
          setBreathStatus("exhale");
          setCurrentDuration(breathParams.exhaleTime);
          setExercisedTime((prevExercisedTime) => prevExercisedTime + 1);
        }
      }, 1000);
      setTimer(_timer);
    } else {
      // 如果 isStarted 为 false，执行相应的操作
      clearInterval(timer);
      setTimer(undefined);
    }
  }, [isStarted]); // 将 isStarted 添加到依赖数组中

  return (
    <div className="my-app">
      <h1>呼吸练习计时器</h1>
      {!isStarted && (
        <main>
          <TimerSetting
            breathParams={breathParams}
            updateBreathParams={updateBreathParams}
            setIsStarted={setIsStarted}
          />
          {isFinished && (
            <p className="exercise-summary">
              呼吸练习结束，时长：{formatTime(exercisedTime)}
            </p>
          )}
        </main>
      )}
      {isStarted && (
        <main>
          <Timer
            breathParams={breathParams}
            breathStatus={breathStatus}
            exercisedTime={exercisedTime}
            currentDuration={currentDuration}
            setIsStarted={setIsStarted}
            isNextSwitch={
              (breathStatus === "inhale" &&
                currentDuration >= breathParams.inhaleTime) ||
              (breathStatus === "exhale" &&
                currentDuration >= breathParams.exhaleTime)
            }
          />
        </main>
      )}
    </div>
  );
}
