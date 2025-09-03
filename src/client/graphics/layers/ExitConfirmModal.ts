import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { EventBus } from "../../../core/EventBus";
import { translateText } from "../../Utils";

export class ShowExitConfirmModalEvent {
  constructor() {}
}

@customElement("exit-confirm-modal")
export class ExitConfirmModal extends LitElement {
  public eventBus: EventBus | undefined;
  @state()
  private isVisible = false;

  private pendingResolve: ((value: boolean) => void) | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private readonly cleanupKeydown = () => {
    if (this.keydownHandler) {
      window.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }
  };

  createRenderRoot() {
    return this;
  }

  static styles = css`
    .exit-modal {
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(30, 30, 30, 0.7);
      padding: 25px;
      border-radius: 10px;
      z-index: 9999;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      color: white;
      width: 350px;
      transition:
        opacity 0.3s ease-in-out,
        visibility 0.3s ease-in-out;
    }

    .exit-modal.visible {
      display: block;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translate(-50%, -48%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }

    .exit-modal h2 {
      margin: 0 0 15px 0;
      font-size: 26px;
      text-align: center;
      color: white;
    }

    .exit-modal p {
      margin: 0 0 20px 0;
      text-align: center;
      background-color: rgba(0, 0, 0, 0.3);
      padding: 10px;
      border-radius: 5px;
    }

    .button-container {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }

    .exit-modal button {
      flex: 1;
      padding: 12px;
      font-size: 16px;
      cursor: pointer;
      background: rgba(0, 150, 255, 0.6);
      color: white;
      border: none;
      border-radius: 5px;
      transition:
        background-color 0.2s ease,
        transform 0.1s ease;
    }

    .exit-modal button:hover {
      background: rgba(0, 150, 255, 0.8);
      transform: translateY(-1px);
    }

    .exit-modal button:active {
      transform: translateY(1px);
    }

    @media (max-width: 768px) {
      .exit-modal {
        width: 90%;
        max-width: 300px;
        padding: 20px;
      }

      .exit-modal h2 {
        font-size: 26px;
      }

      .exit-modal button {
        padding: 10px;
        font-size: 14px;
      }
    }
  `;

  constructor() {
    super();
    const styleEl = document.createElement("style");
    styleEl.textContent = ExitConfirmModal.styles.toString();
    document.head.appendChild(styleEl);
  }

  initEventBus(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.eventBus.on(ShowExitConfirmModalEvent, async () => {
      const confirmed = await this.open();
      if (confirmed) {
        window.location.href = "/";
      }
    });
  }

  render() {
    return html`
      <div
        class="exit-modal ${this.isVisible ? "visible" : ""}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-confirm-title"
        aria-describedby="exit-confirm-desc"
        tabindex="-1"
      >
        <h2 id="exit-confirm-title">${translateText("user_setting.exit_game_label")}</h2>
        <p id="exit-confirm-desc">${translateText("help_modal.exit_confirmation")}</p>
        <div class="button-container">
          <button
            id="exit-confirm-cancel"
            data-action="cancel"
            @click=${this.onCancel}
          >
            ${translateText("win_modal.keep")}
          </button>
          <button
            id="exit-confirm-confirm"
            data-action="confirm"
            @click=${this.onConfirm}
          >
            ${translateText("win_modal.exit")}
          </button>
        </div>
      </div>
    `;
  }

  public open(): Promise<boolean> {
    if (this.pendingResolve) {
      this.pendingResolve(false);
      this.cleanupKeydown();
    }
    const promise = new Promise<boolean>((resolve) => {
      this.pendingResolve = resolve;
    });
    this.isVisible = true;
    this.requestUpdate();
    this.cleanupKeydown();
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.onCancel();
      }
    };
    window.addEventListener("keydown", this.keydownHandler);

    void this.updateComplete.then(() => {
      const primary = this.querySelector("#exit-confirm-confirm");
      const container = this.querySelector(".exit-modal");
      const target = primary ?? container;
      if (target instanceof HTMLElement) target.focus();
    });
    return promise;
  }

  private readonly onConfirm = () => {
    if (this.pendingResolve) {
      const r = this.pendingResolve;
      this.pendingResolve = null;
      r(true);
    }
    this.cleanupKeydown();
    this.isVisible = false;
    this.requestUpdate();
  };

  private readonly onCancel = () => {
    if (this.pendingResolve) {
      const r = this.pendingResolve;
      this.pendingResolve = null;
      r(false);
    }
    this.cleanupKeydown();
    this.isVisible = false;
    this.requestUpdate();
  };
}
