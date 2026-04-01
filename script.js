// Task Manager Application
class TaskManager {
  constructor() {
    this.tasks = this.loadFromStorage();
    this.currentFilter = "all";
    this.editingId = null;

    this.initElements();
    this.initEventListeners();
    this.render();
  }

  initElements() {
    this.taskInput = document.getElementById("taskInput");
    this.addBtn = document.getElementById("addBtn");
    this.taskList = document.getElementById("taskList");
    this.emptyState = document.getElementById("emptyState");
    this.clearCompletedBtn = document.getElementById("clearCompleted");
    this.toast = document.getElementById("toast");
    this.toastMessage = document.getElementById("toastMessage");
    this.toastIcon = document.getElementById("toastIcon");

    this.totalTasksEl = document.getElementById("totalTasks");
    this.activeTasksEl = document.getElementById("activeTasks");
    this.completedTasksEl = document.getElementById("completedTasks");

    this.filterBtns = document.querySelectorAll(".filter-btn");
  }

  initEventListeners() {
    // Add task
    this.addBtn.addEventListener("click", () => this.addTask());
    this.taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addTask();
    });

    // Filter tabs
    this.filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentFilter = btn.dataset.filter;
        this.render();
      });
    });

    // Clear completed
    this.clearCompletedBtn.addEventListener("click", () =>
      this.clearCompleted(),
    );

    // Task list delegation
    this.taskList.addEventListener("click", (e) => this.handleTaskClick(e));
    this.taskList.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && e.target.classList.contains("task-text")) {
        e.preventDefault();
        this.saveEdit(this.editingId);
      }
    });
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem("taskManagerTasks");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error loading from storage:", e);
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem("taskManagerTasks", JSON.stringify(this.tasks));
    } catch (e) {
      console.error("Error saving to storage:", e);
    }
  }

  addTask() {
    const text = this.taskInput.value.trim();
    if (!text) {
      this.showToast("Please enter a task", "error");
      return;
    }

    const task = {
      id: this.generateId(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.tasks.unshift(task);
    this.saveToStorage();
    this.taskInput.value = "";
    this.render();
    this.showToast("Task added successfully", "success");
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveToStorage();
      this.render();
      this.showToast(
        task.completed ? "Task completed!" : "Task marked active",
        "success",
      );
    }
  }

  startEdit(id) {
    if (this.editingId) {
      this.cancelEdit(this.editingId);
    }

    this.editingId = id;
    this.render();

    const taskElement = document.querySelector(`[data-id="${id}"] .task-text`);
    if (taskElement) {
      taskElement.contentEditable = true;
      taskElement.focus();

      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(taskElement);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  saveEdit(id) {
    const taskElement = document.querySelector(`[data-id="${id}"] .task-text`);
    if (!taskElement) return;

    const newText = taskElement.innerText.trim();
    if (!newText) {
      this.showToast("Task cannot be empty", "error");
      return;
    }

    const task = this.tasks.find((t) => t.id === id);
    if (task && newText !== task.text) {
      task.text = newText;
      task.updatedAt = new Date().toISOString();
      this.saveToStorage();
      this.showToast("Task updated", "success");
    }

    this.editingId = null;
    this.render();
  }

  cancelEdit(id) {
    this.editingId = null;
    this.render();
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.saveToStorage();
    this.render();
    this.showToast("Task deleted", "info");
  }

  clearCompleted() {
    const completedCount = this.tasks.filter((t) => t.completed).length;
    if (completedCount === 0) return;

    this.tasks = this.tasks.filter((t) => !t.completed);
    this.saveToStorage();
    this.render();
    this.showToast(`${completedCount} completed tasks cleared`, "info");
  }

  getFilteredTasks() {
    switch (this.currentFilter) {
      case "active":
        return this.tasks.filter((t) => !t.completed);
      case "completed":
        return this.tasks.filter((t) => t.completed);
      default:
        return this.tasks;
    }
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.completed).length;
    const active = total - completed;

    this.totalTasksEl.textContent = total;
    this.activeTasksEl.textContent = active;
    this.completedTasksEl.textContent = completed;

    // Show/hide clear completed button
    if (completed > 0) {
      this.clearCompletedBtn.classList.add("visible");
    } else {
      this.clearCompletedBtn.classList.remove("visible");
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  handleTaskClick(e) {
    const taskItem = e.target.closest(".task-item");
    if (!taskItem) return;

    const id = taskItem.dataset.id;

    // Checkbox click
    if (e.target.closest(".checkbox")) {
      this.toggleTask(id);
      return;
    }

    // Edit button
    if (e.target.closest(".edit-btn")) {
      this.startEdit(id);
      return;
    }

    // Save button (when editing)
    if (e.target.closest(".save-btn")) {
      this.saveEdit(id);
      return;
    }

    // Delete button
    if (e.target.closest(".delete-btn")) {
      // Show delete confirmation overlay
      const confirmDiv = taskItem.querySelector(".delete-confirm");
      if (confirmDiv) {
        confirmDiv.classList.add("show");
      }
      return;
    }

    // Confirm delete yes
    if (e.target.closest(".confirm-yes")) {
      this.deleteTask(id);
      return;
    }

    // Confirm delete no
    if (e.target.closest(".confirm-no")) {
      const confirmDiv = taskItem.querySelector(".delete-confirm");
      if (confirmDiv) {
        confirmDiv.classList.remove("show");
      }
      return;
    }
  }

  render() {
    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      this.taskList.style.display = "none";
      this.emptyState.style.display = "block";
      if (this.currentFilter !== "all") {
        this.emptyState.querySelector(".empty-text").textContent =
          `No ${this.currentFilter} tasks`;
        this.emptyState.querySelector(".empty-subtext").textContent =
          `Try switching to a different filter`;
      } else {
        this.emptyState.querySelector(".empty-text").textContent =
          "No tasks yet";
        this.emptyState.querySelector(".empty-subtext").textContent =
          "Add a task above to get started";
      }
    } else {
      this.taskList.style.display = "block";
      this.emptyState.style.display = "none";

      this.taskList.innerHTML = filteredTasks
        .map(
          (task) => `
                        <li class="task-item ${task.completed ? "completed" : ""} ${this.editingId === task.id ? "editing" : ""}" data-id="${task.id}">
                            <div class="checkbox ${task.completed ? "checked" : ""}"></div>
                            <div class="task-content">
                                <div class="task-text" ${this.editingId === task.id ? 'contenteditable="true"' : ""}>${this.escapeHtml(task.text)}</div>
                                <div class="task-date">${this.formatDate(task.createdAt)}</div>
                            </div>
                            <div class="task-actions">
                                ${
                                  this.editingId === task.id
                                    ? `
                                    <button class="action-btn save save-btn" title="Save">✓</button>
                                `
                                    : `
                                    <button class="action-btn edit edit-btn" title="Edit">✎</button>
                                    <button class="action-btn delete delete-btn" title="Delete">🗑</button>
                                `
                                }
                            </div>
                            <div class="delete-confirm">
                                <span style="color: white; font-weight: 600; margin-right: 8px;">Delete?</span>
                                <button class="confirm-btn confirm-yes">Yes</button>
                                <button class="confirm-btn confirm-no">No</button>
                            </div>
                        </li>
                    `,
        )
        .join("");
    }

    this.updateStats();
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showToast(message, type = "info") {
    this.toastMessage.textContent = message;
    this.toast.className = `toast ${type}`;

    const icons = {
      success: "✓",
      error: "✕",
      info: "ℹ",
    };
    this.toastIcon.textContent = icons[type] || "ℹ";

    this.toast.classList.add("show");

    setTimeout(() => {
      this.toast.classList.remove("show");
    }, 3000);
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TaskManager();
});
