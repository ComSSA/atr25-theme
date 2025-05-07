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
        label: {
          backgroundColor: "#212529",
          color: "#ffffff",
          borderColor: "#00ff00",
          borderWidth: 1,
          padding: [5, 10],
          fontFamily: "'Share Tech Mono', monospace",
        },
        crossStyle: {
          color: "#00ff00",
        },
        lineStyle: {
          color: "#00ff00",
        },
      },
      backgroundColor: "#212529",
      borderColor: "#00ff00",
      borderWidth: 1,
      textStyle: {
        color: "#ffffff",
        fontFamily: "'Share Tech Mono', monospace",
      },
    },
    legend: {
      type: "scroll",
      orient: "horizontal",
      align: "left",
      bottom: 35,
      data: [name],
      textStyle: {
        color: "#00ff00",
        fontFamily: "'Share Tech Mono', monospace",
      },
    },
    toolbox: {
      iconStyle: {
        borderColor: "#00ff00",
      },
      feature: {
        dataZoom: {
          yAxisIndex: "none",
        },
        saveAsImage: {},
        title: "Download",
        iconStyle: {
          borderColor: "#00ff00",
        },
      },
    },
    grid: {
      containLabel: true,
      borderColor: "#00ff00",
    },
    xAxis: [
      {
        type: "time",
        boundaryGap: false,
        data: [],
        axisLine: {
          lineStyle: {
            color: "#00ff00"
          }
        },
        axisLabel: {
          color: "#00ff00",
          fontFamily: "'Share Tech Mono', monospace"
        },
        splitLine: {
          lineStyle: {
            color: "#005500",
          },
        },
      },
    ],
    yAxis: [
      {
        type: "value",
        axisLine: { lineStyle: { color: "#00ff00" } },
        axisLabel: { color: "#00ff00", fontFamily: "'Share Tech Mono', monospace" },
        splitLine: {
          lineStyle: {
            color: "#005500",
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
        height: 15,
        bottom: 10,
        fillerColor: "rgba(0, 255, 0, 0.1)",
        moveHandleStyle: {
          color: "#008800",
        },
        handleStyle: {
          color: "#00ff00",
        },
        textStyle: {
          color: "#00ff00",
        },
        backgroundColor: "#212529",
        emphasis: {
          moveHandleStyle: {
            color: "#00ff00",
          },
        },
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
    option.xAxis[0].data.push(time.getTime());
  });

  const seriesData = times.map((time, index) => {
    return [time, cumulativeSum(scores)[index]];
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
        opacity: 0.4,
      },
    },
    itemStyle: {
      normal: {
        color: colorHash(name + id),
      },
    },
    data: seriesData,
  });

  if (optionMerge) {
    option = mergeObjects(option, optionMerge);
  }

  return option;
}