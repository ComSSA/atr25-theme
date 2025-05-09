import { colorHash } from "@ctfdio/ctfd-js/ui";
import { mergeObjects } from "../../objects";
import { cumulativeSum } from "../../math";
import dayjs from "dayjs";

export function getOption(mode, places, optionMerge) {
  let option = {
    title: {
      left: "center",
      text: "Top 10 " + (mode === "teams" ? "Teams" : "Users"),
      textStyle: {
        color: "#00ff00",
        fontFamily: "'Share Tech Mono', monospace",
      }
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
      data: [],
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
        axisLine: {
          lineStyle: {
            color: "#00ff00",
          },
        },
        axisTick: {
          lineStyle: {
            color: "#00ff00",
          },
        },
        axisLabel: {
          color: "#00ff00",
          fontFamily: "'Share Tech Mono', monospace",
        },
        splitLine: {
          lineStyle: {
            color: "#005500",
          },
        },
        data: [],
      },
    ],
    yAxis: [
      {
        type: "value",
        axisLine: {
          lineStyle: {
            color: "#ae19bb",
          },
        },
        axisLabel: {
          color: "#00ff00",
          fontFamily: "'Share Tech Mono', monospace",
        },
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

  const teams = Object.keys(places);
  for (let i = 0; i < teams.length; i++) {
    const team_score = [];
    const times = [];
    for (let j = 0; j < places[teams[i]]["solves"].length; j++) {
      team_score.push(places[teams[i]]["solves"][j].value);
      const date = dayjs(places[teams[i]]["solves"][j].date);
      times.push(date.toDate());
    }

    const total_scores = cumulativeSum(team_score);
    let scores = times.map(function (e, i) {
      return [e, total_scores[i]];
    });

    option.legend.data.push(places[teams[i]]["name"]);

    const data = {
      name: places[teams[i]]["name"],
      type: "line",
      label: {
        normal: {
          position: "top",
        },
      },
      itemStyle: {
        normal: {
          color: colorHash(places[teams[i]]["name"] + places[teams[i]]["id"]),
        },
      },
      data: scores,
    };
    option.series.push(data);
  }

  if (optionMerge) {
    option = mergeObjects(option, optionMerge);
  }
  return option;
}
