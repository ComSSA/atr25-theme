import { colorHash } from "@ctfdio/ctfd-js/ui";
import { cumulativeSum } from "../../math";
import { mergeObjects } from "../../objects";
import dayjs from "dayjs";

export function getOption(id, name, solves, awards, optionMerge) {
  let option = {
    title: {
      left: "center",
      text: "Score over Time",
      textStyle: {
        color: "#00ff00",
        fontFamily: "'Share Tech Mono', monospace",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
    },
    legend: {
      type: "scroll",
      orient: "horizontal",
      align: "left",
      bottom: 30,
      data: [name],
      textStyle: {
        color: "#00ff00",
        fontFamily: "'Share Tech Mono', monospace",
      },
    },
    toolbox: {
      feature: {
        saveAsImage: {},
      },
    },
    grid: {
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        boundaryGap: false,
        data: [],
        axisLine: { lineStyle: { color: "#00ff00" } },
        axisLabel: { color: "#00ff00" },
        splitLine: { show: false },
      },
    ],
    yAxis: [
      {
        type: "value",
        axisLine: { lineStyle: { color: "#00ff00" } },
        axisLabel: { color: "#00ff00" },
        splitLine: {
          lineStyle: {
            color: "#004400",
            type: "dashed",
          },
        },
      },
    ],
    dataZoom: [
      {
        id: "dataZoomX",
        type: "slider",
        xAxisIndex: [0],
        filterMode: "filter",
        height: 10,
        bottom: 0,
        fillerColor: "rgba(0, 255, 0, 0.2)",
        borderColor: "#00ff00",
        handleStyle: {
          color: "#00ff00",
        },
        textStyle: {
          color: "#00ff00",
        },
        backgroundColor: "#111",
      },
    ],
    series: [],
  };

  const times = [];
  const scores = [];
  const total = solves.concat(awards);

  total.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  for (let i = 0; i < total.length; i++) {
    const date = dayjs(total[i].date);
    times.push(date.toDate());
    try {
      scores.push(total[i].challenge.value);
    } catch (e) {
      scores.push(total[i].value);
    }
  }

  times.forEach(time => {
    option.xAxis[0].data.push(time);
  });

  option.series.push({
    name: name,
    type: "line",
    label: {
      normal: {
        show: true,
        position: "top",
        color: "#00ff00",
        fontFamily: "'Share Tech Mono', monospace",
      },
    },
    areaStyle: {
      normal: {
        color: colorHash(name + id),
      },
    },
    itemStyle: {
      normal: {
        color: colorHash(name + id),
        shadowBlur: 10,
        shadowColor: "#00ff00",
      },
    },
    data: cumulativeSum(scores),
  });

  if (optionMerge) {
    option = mergeObjects(option, optionMerge);
  }

  return option;
}