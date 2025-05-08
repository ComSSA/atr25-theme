import Alpine from "alpinejs";
import dayjs from "dayjs";

import CTFd from "./index";

import { Modal, Tab, Tooltip } from "bootstrap";
import highlight from "./theme/highlight";
import { getChallenge } from "@ctfdio/ctfd-js/pages/challenges";

function addTargetBlank(html) {
  let dom = new DOMParser();
  let view = dom.parseFromString(html, "text/html");
  let links = view.querySelectorAll('a[href*="://"]');
  links.forEach(link => {
    link.setAttribute("target", "_blank");
  });
  return view.documentElement.outerHTML;
}

window.Alpine = Alpine;

Alpine.store("challenge", {
  data: {
    view: "",
  },
});

Alpine.data("Hint", () => ({
  id: null,
  html: null,

  async showHint(event) {
    if (event.target.open) {
      let response = await CTFd.pages.challenge.loadHint(this.id);
      let hint = response.data;
      if (hint.content) {
        this.html = addTargetBlank(hint.html);
      } else {
        let answer = await CTFd.pages.challenge.displayUnlock(this.id);
        if (answer) {
          let unlock = await CTFd.pages.challenge.loadUnlock(this.id);

          if (unlock.success) {
            let response = await CTFd.pages.challenge.loadHint(this.id);
            let hint = response.data;
            this.html = addTargetBlank(hint.html);
          } else {
            event.target.open = false;
            CTFd._functions.challenge.displayUnlockError(unlock);
          }
        } else {
          event.target.open = false;
        }
      }
    }
  },
}));

Alpine.data("Challenge", () => ({
  id: null,
  next_id: null,
  submission: "",
  tab: null,
  solves: [],
  response: null,
  share_url: null,
  max_attempts: 0,
  attempts: 0,

  async init() {
    highlight();
  },

  getStyles() {
    let styles = {
      "modal-dialog": true,
    };
    try {
      let size = CTFd.config.themeSettings.challenge_window_size;
      switch (size) {
        case "sm":
          styles["modal-sm"] = true;
          break;
        case "lg":
          styles["modal-lg"] = true;
          break;
        case "xl":
          styles["modal-xl"] = true;
          break;
        default:
          break;
      }
    } catch (error) {
      // Ignore errors with challenge window size
      console.log("Error processing challenge_window_size");
      console.log(error);
    }
    return styles;
  },

  async init() {
    highlight();
  },

  async showChallenge() {
    new Tab(this.$el).show();
  },

  async showSolves() {
    this.solves = await CTFd.pages.challenge.loadSolves(this.id);
    this.solves.forEach(solve => {
      solve.date = dayjs(solve.date).format("MMMM Do, h:mm:ss A");
      return solve;
    });
    new Tab(this.$el).show();
  },

  getNextId() {
    let data = Alpine.store("challenge").data;
    return data.next_id;
  },

  async nextChallenge() {
    let modal = Modal.getOrCreateInstance("[x-ref='challengeWindow']");

    // TODO: Get rid of this private attribute access
    // See https://github.com/twbs/bootstrap/issues/31266
    modal._element.addEventListener(
      "hidden.bs.modal",
      event => {
        // Dispatch load-challenge event to call loadChallenge in the ChallengeBoard
        Alpine.nextTick(() => {
          this.$dispatch("load-challenge", this.getNextId());
        });
      },
      { once: true },
    );
    modal.hide();
  },

  async getShareUrl() {
    let body = {
      type: "solve",
      challenge_id: this.id,
    };
    const response = await CTFd.fetch("/api/v1/shares", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await response.json();
    const url = data["data"]["url"];
    this.share_url = url;
  },

  copyShareUrl() {
    navigator.clipboard.writeText(this.share_url);
    let t = Tooltip.getOrCreateInstance(this.$el);
    t.enable();
    t.show();
    setTimeout(() => {
      t.hide();
      t.disable();
    }, 2000);
  },

  async submitChallenge() {
    this.response = await CTFd.pages.challenge.submitChallenge(
      this.id,
      this.submission,
    );

    await this.renderSubmissionResponse();
  },

  async renderSubmissionResponse() {
    if (this.response.data.status === "correct") {
      this.submission = "";
    }

    // Increment attempts counter
    if (this.max_attempts > 0 && this.response.data.status != "already_solved") {
      this.attempts += 1;
    }

    // Dispatch load-challenges event to call loadChallenges in the ChallengeBoard
    this.$dispatch("load-challenges");
  },
}));

Alpine.data("ChallengeBoard", () => ({
  loaded: false,
  challenges: [],
  challenge: null,

  async init() {
    this.challenges = await CTFd.pages.challenges.getChallenges();
    window["mapManager"] = new MapManager(this.challenges);
    this.loaded = true;

    if (window.location.hash) {
      let chalHash = decodeURIComponent(window.location.hash.substring(1));
      let idx = chalHash.lastIndexOf("-");
      if (idx >= 0) {
        let pieces = [chalHash.slice(0, idx), chalHash.slice(idx + 1)];
        let id = pieces[1];
        await this.loadChallenge(id);
      }
    }
  },

  getCategories() {
    const categories = [];

    this.challenges.forEach(challenge => {
      const { category } = challenge;

      if (!categories.includes(category)) {
        categories.push(category);
      }
    });

    try {
      const f = CTFd.config.themeSettings.challenge_category_order;
      if (f) {
        const getSort = new Function(`return (${f})`);
        categories.sort(getSort());
      }
    } catch (error) {
      // Ignore errors with theme category sorting
      console.log("Error running challenge_category_order function");
      console.log(error);
    }

    return categories;
  },

  getChallenges(category) {
    let challenges = this.challenges;

    if (category !== null) {
      challenges = this.challenges.filter(challenge => challenge.category === category);
    }

    try {
      const f = CTFd.config.themeSettings.challenge_order;
      if (f) {
        const getSort = new Function(`return (${f})`);
        challenges.sort(getSort());
      }
    } catch (error) {
      // Ignore errors with theme challenge sorting
      console.log("Error running challenge_order function");
      console.log(error);
    }

    return challenges;
  },

  async loadChallenges() {
    this.challenges = await CTFd.pages.challenges.getChallenges();
  },

  async loadChallenge(challengeId) {
    await CTFd.pages.challenge.displayChallenge(challengeId, challenge => {
      challenge.data.view = addTargetBlank(challenge.data.view);
      Alpine.store("challenge").data = challenge.data;

      // nextTick is required here because we're working in a callback
      Alpine.nextTick(() => {
        let modal = Modal.getOrCreateInstance("[x-ref='challengeWindow']");
        // TODO: Get rid of this private attribute access
        // See https://github.com/twbs/bootstrap/issues/31266
        modal._element.addEventListener(
          "hidden.bs.modal",
          event => {
            // Remove location hash
            history.replaceState(null, null, " ");
          },
          { once: true },
        );
        modal.show();
        history.replaceState(null, null, `#${challenge.data.name}-${challengeId}`);
      });
    });
  },
}));

Alpine.start();

class MapManager {
  constructor(challenges) {
    this.challenges = challenges;
    this.icons = [];
    this.renderBackground();
    this.renderTasks();
    this.registerMouseOverHook();
    this.width = 1000;
    this.height = 500;
  }

  getChallenges() {
    return this.challenges;
  }

  renderBackground() {
    const canvas = document.getElementById("map");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = "/themes/atr25-theme/static/img/atr_map.svg";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }

  renderTasks() {
    // filter down to tasks with tags
    let tasks = this.challenges.filter(challenge => {
      return challenge.tags && challenge.tags.length > 0;
    });
    console.log(tasks);
    // adding new tasks icons to mapRoot
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const props = {};

      // decode tags
      for (let j = 0; j < task.tags.length; j++) {
        const split = task.tags[j].value.split(":");
        const key = split[0];
        const value = split[1];
        if (key && value) {
          props[key] = value;
        }
      }

      const canvas = document.getElementById("map");
      const ctx = canvas.getContext("2d");

      // Ensure props.x and props.y exist and are numbers
      if (props.x && props.y) {
        const x = parseInt(props.x);
        const y = parseInt(props.y);

        const img = new Image();
        img.src = "/themes/atr25-theme/static/img/task.png";
        img.onload = () => {
          ctx.drawImage(img, x, y, 49, 49);
          this.icons.push({ x, y, width: 49, height: 49, task });
        };
      }
    }
  }

  registerMouseOverHook() {
    const canvas = document.getElementById("map");
    canvas.addEventListener("mousemove", event => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const scaleX = rect.width / this.width;
      const scaleY = rect.height / this.height;

      // scaled mouse position against 1000x500
      const scaledX = mouseX / scaleX;
      const scaledY = mouseY / scaleY;

      // check if mouse is over any icon
      let found = false;
      for (let i = 0; i < this.icons.length; i++) {
        const icon = this.icons[i];
        if (
          scaledX >= icon.x &&
          scaledX <= icon.x + icon.width &&
          scaledY >= icon.y &&
          scaledY <= icon.y + icon.height
        ) {
          found = true;
          this.showTooltip(icon.task, event.clientX, event.clientY);
          canvas.style.cursor = "pointer";
          break;
        }
      }
      if (!found) {
        canvas.style.cursor = "default";
        this.hideTooltip();
      }
    });
  }

  showTooltip(task, x, y) {
    let tooltip = document.getElementById("map-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "map-tooltip";
      tooltip.style.position = "absolute";
      tooltip.style.background = "rgba(0, 0, 0, 0.8)";
      tooltip.style.color = "white";
      tooltip.style.padding = "5px";
      tooltip.style.borderRadius = "5px";
      tooltip.style.pointerEvents = "none";
      document.body.appendChild(tooltip);
    }

    tooltip.textContent = task.name || "Task";
    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y + 10}px`;
    tooltip.style.display = "block";
  }

  hideTooltip() {
    const tooltip = document.getElementById("map-tooltip");
    if (tooltip) {
      tooltip.style.display = "none";
    }
  }
}