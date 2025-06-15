// ===== TODO APP JAVASCRIPT =====
class TodoApp {
  constructor() {
    this.tasks = []
    this.currentFilter = "all"
    this.searchQuery = ""
    this.taskIdCounter = 0

    this.initializeElements()
    this.bindEvents()
    this.loadTasks()
    this.updateStats()
    this.renderTasks()
  }

  // ===== INITIALIZATION =====
  initializeElements() {
    this.inputBox = document.getElementById("input-box")
    this.listContainer = document.getElementById("list-container")
    this.todoForm = document.getElementById("todo-form")
    this.searchBox = document.getElementById("search-box")
    this.clearSearchBtn = document.getElementById("clear-search")
    this.emptyState = document.getElementById("empty-state")
    this.noResults = document.getElementById("no-results")

    // Stats elements
    this.totalTasksEl = document.getElementById("total-tasks")
    this.completedTasksEl = document.getElementById("completed-tasks")
    this.pendingTasksEl = document.getElementById("pending-tasks")

    // Action buttons
    this.markAllCompleteBtn = document.getElementById("mark-all-complete")
    this.clearCompletedBtn = document.getElementById("clear-completed")

    // Filter buttons
    this.filterButtons = document.querySelectorAll("[data-filter]")

    // Toast
    const toastEl = document.getElementById("toast")
    this.toast = new bootstrap.Toast(toastEl)
    this.toastMessage = document.getElementById("toast-message")
  }

  // ===== EVENT BINDING =====
  bindEvents() {
    // Form submission
    this.todoForm.addEventListener("submit", (e) => {
      e.preventDefault()
      this.addTask()
    })

    // Search functionality
    this.searchBox.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase()
      this.renderTasks()
    })

    this.clearSearchBtn.addEventListener("click", () => {
      this.searchBox.value = ""
      this.searchQuery = ""
      this.renderTasks()
    })

    // Filter buttons
    this.filterButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setFilter(e.target.dataset.filter)
      })
    })

    // Action buttons
    this.markAllCompleteBtn.addEventListener("click", () => {
      this.markAllComplete()
    })

    this.clearCompletedBtn.addEventListener("click", () => {
      this.clearCompleted()
    })

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "a":
            e.preventDefault()
            this.markAllComplete()
            break
          case "d":
            e.preventDefault()
            this.clearCompleted()
            break
        }
      }
    })
  }

  // ===== TASK MANAGEMENT =====
  addTask() {
    const taskText = this.inputBox.value.trim()

    if (!taskText) {
      this.showToast("Please enter a task description!", "warning")
      this.inputBox.classList.add("is-invalid")
      return
    }

    if (taskText.length > 200) {
      this.showToast("Task description is too long (max 200 characters)!", "warning")
      return
    }

    const task = {
      id: ++this.taskIdCounter,
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    }

    this.tasks.unshift(task)
    this.inputBox.value = ""
    this.inputBox.classList.remove("is-invalid")

    this.saveTasks()
    this.updateStats()
    this.renderTasks()

    this.showToast("Task added successfully!", "success")

    // Focus back to input for quick adding
    this.inputBox.focus()
  }

  toggleTask(taskId) {
    const task = this.tasks.find((t) => t.id === taskId)
    if (task) {
      task.completed = !task.completed
      task.completedAt = task.completed ? new Date().toISOString() : null

      this.saveTasks()
      this.updateStats()
      this.renderTasks()

      const message = task.completed ? "Task completed!" : "Task marked as pending!"
      this.showToast(message, task.completed ? "success" : "info")
    }
  }

  deleteTask(taskId) {
    const taskIndex = this.tasks.findIndex((t) => t.id === taskId)
    if (taskIndex > -1) {
      this.tasks.splice(taskIndex, 1)

      this.saveTasks()
      this.updateStats()
      this.renderTasks()

      this.showToast("Task deleted!", "info")
    }
  }

  editTask(taskId) {
    const task = this.tasks.find((t) => t.id === taskId)
    if (task) {
      const newText = prompt("Edit task:", task.text)
      if (newText && newText.trim() && newText.trim() !== task.text) {
        if (newText.trim().length > 200) {
          this.showToast("Task description is too long (max 200 characters)!", "warning")
          return
        }

        task.text = newText.trim()

        this.saveTasks()
        this.renderTasks()

        this.showToast("Task updated!", "success")
      }
    }
  }

  markAllComplete() {
    const pendingTasks = this.tasks.filter((task) => !task.completed)
    if (pendingTasks.length === 0) {
      this.showToast("No pending tasks to complete!", "info")
      return
    }

    pendingTasks.forEach((task) => {
      task.completed = true
      task.completedAt = new Date().toISOString()
    })

    this.saveTasks()
    this.updateStats()
    this.renderTasks()

    this.showToast(`${pendingTasks.length} tasks completed!`, "success")
  }

  clearCompleted() {
    const completedTasks = this.tasks.filter((task) => task.completed)
    if (completedTasks.length === 0) {
      this.showToast("No completed tasks to clear!", "info")
      return
    }

    if (confirm(`Are you sure you want to delete ${completedTasks.length} completed tasks?`)) {
      this.tasks = this.tasks.filter((task) => !task.completed)

      this.saveTasks()
      this.updateStats()
      this.renderTasks()

      this.showToast(`${completedTasks.length} completed tasks cleared!`, "success")
    }
  }

  // ===== FILTERING AND SEARCH =====
  setFilter(filter) {
    this.currentFilter = filter

    // Update active button
    this.filterButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === filter)
    })

    this.renderTasks()
  }

  getFilteredTasks() {
    let filteredTasks = [...this.tasks]

    // Apply filter
    switch (this.currentFilter) {
      case "pending":
        filteredTasks = filteredTasks.filter((task) => !task.completed)
        break
      case "completed":
        filteredTasks = filteredTasks.filter((task) => task.completed)
        break
    }

    // Apply search
    if (this.searchQuery) {
      filteredTasks = filteredTasks.filter((task) => task.text.toLowerCase().includes(this.searchQuery))
    }

    return filteredTasks
  }

  // ===== RENDERING =====
  renderTasks() {
    const filteredTasks = this.getFilteredTasks()

    if (this.tasks.length === 0) {
      this.showEmptyState()
      return
    }

    if (filteredTasks.length === 0) {
      this.showNoResults()
      return
    }

    this.hideEmptyStates()

    this.listContainer.innerHTML = filteredTasks.map((task) => this.createTaskHTML(task)).join("")

    // Bind task events
    this.bindTaskEvents()
  }

  createTaskHTML(task) {
    const createdDate = new Date(task.createdAt).toLocaleDateString()
    const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ""

    return `
            <li class="task-item ${task.completed ? "completed" : ""}" data-task-id="${task.id}">
                <div class="task-content">
                    <div class="task-left">
                        <div class="task-checkbox ${task.completed ? "checked" : ""}" onclick="todoApp.toggleTask(${task.id})">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="task-text" title="Created: ${createdDate}${completedDate ? " | Completed: " + completedDate : ""}">${this.escapeHtml(task.text)}</div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn edit-btn" onclick="todoApp.editTask(${task.id})" title="Edit task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-action-btn delete-btn" onclick="todoApp.deleteTask(${task.id})" title="Delete task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </li>
        `
  }

  bindTaskEvents() {
    // Add click event for task text to toggle completion
    const taskTexts = document.querySelectorAll(".task-text")
    taskTexts.forEach((taskText) => {
      taskText.addEventListener("click", (e) => {
        const taskId = Number.parseInt(e.target.closest(".task-item").dataset.taskId)
        this.toggleTask(taskId)
      })
    })
  }

  showEmptyState() {
    this.listContainer.innerHTML = ""
    this.emptyState.classList.remove("d-none")
    this.noResults.classList.add("d-none")
  }

  showNoResults() {
    this.listContainer.innerHTML = ""
    this.emptyState.classList.add("d-none")
    this.noResults.classList.remove("d-none")
  }

  hideEmptyStates() {
    this.emptyState.classList.add("d-none")
    this.noResults.classList.add("d-none")
  }

  // ===== STATISTICS =====
  updateStats() {
    const total = this.tasks.length
    const completed = this.tasks.filter((task) => task.completed).length
    const pending = total - completed

    this.totalTasksEl.textContent = total
    this.completedTasksEl.textContent = completed
    this.pendingTasksEl.textContent = pending

    // Update action button states
    this.markAllCompleteBtn.disabled = pending === 0
    this.clearCompletedBtn.disabled = completed === 0
  }

  // ===== DATA PERSISTENCE =====
  saveTasks() {
    try {
      localStorage.setItem("perfectTodoTasks", JSON.stringify(this.tasks))
      localStorage.setItem("perfectTodoCounter", this.taskIdCounter.toString())
    } catch (error) {
      this.showToast("Failed to save tasks!", "error")
    }
  }

  loadTasks() {
    try {
      const savedTasks = localStorage.getItem("perfectTodoTasks")
      const savedCounter = localStorage.getItem("perfectTodoCounter")

      if (savedTasks) {
        this.tasks = JSON.parse(savedTasks)
      }

      if (savedCounter) {
        this.taskIdCounter = Number.parseInt(savedCounter)
      }
    } catch (error) {
      this.showToast("Failed to load tasks!", "error")
      this.tasks = []
      this.taskIdCounter = 0
    }
  }

  // ===== UTILITIES =====
  showToast(message, type = "info") {
    const iconMap = {
      success: "fa-check-circle text-success",
      warning: "fa-exclamation-triangle text-warning",
      error: "fa-exclamation-circle text-danger",
      info: "fa-info-circle text-primary",
    }

    const toastHeader = this.toast._element.querySelector(".toast-header i")
    toastHeader.className = `fas ${iconMap[type]} me-2`

    this.toastMessage.textContent = message
    this.toast.show()
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  // ===== EXPORT/IMPORT (Bonus Feature) =====
  exportTasks() {
    const dataStr = JSON.stringify(this.tasks, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `todo-tasks-${new Date().toISOString().split("T")[0]}.json`
    link.click()

    this.showToast("Tasks exported successfully!", "success")
  }

  importTasks(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedTasks = JSON.parse(e.target.result)
        if (Array.isArray(importedTasks)) {
          this.tasks = importedTasks
          this.taskIdCounter = Math.max(...this.tasks.map((t) => t.id), 0)

          this.saveTasks()
          this.updateStats()
          this.renderTasks()

          this.showToast(`${importedTasks.length} tasks imported successfully!`, "success")
        } else {
          throw new Error("Invalid file format")
        }
      } catch (error) {
        this.showToast("Failed to import tasks! Invalid file format.", "error")
      }
    }
    reader.readAsText(file)
  }
}

// ===== INITIALIZE APP =====
let todoApp

document.addEventListener("DOMContentLoaded", () => {
  todoApp = new TodoApp()



    demoTasks.forEach((taskText) => {
      todoApp.inputBox.value = taskText
      todoApp.addTask()
    })

    // Mark first task as completed for demo
    if (todoApp.tasks.length > 0) {
      todoApp.toggleTask(todoApp.tasks[0].id)
    }
  
})

// ===== SERVICE WORKER (Optional) =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // navigator.serviceWorker.register('/sw.js')
    //     .then(registration => console.log('SW registered'))
    //     .catch(error => console.log('SW registration failed'));
  })
}
