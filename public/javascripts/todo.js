// Todo App JavaScript
class TodoApp {
  constructor() {
    this.initializeEventListeners();
    this.initializeFilters();
  }

  initializeEventListeners() {
    // Add todo form
    const addForm = document.getElementById("addTodoForm");
    if (addForm) {
      addForm.addEventListener("submit", (e) => this.handleAddTodo(e));
    }

    // Edit todo form
    const editForm = document.getElementById("editTodoForm");
    if (editForm) {
      editForm.addEventListener("submit", (e) => this.handleEditTodo(e));
    }

    // Cancel edit button
    const cancelEdit = document.getElementById("cancelEdit");
    if (cancelEdit) {
      cancelEdit.addEventListener("click", () => this.closeEditModal());
    }

    // Modal background click to close
    const editModal = document.getElementById("editModal");
    if (editModal) {
      editModal.addEventListener("click", (e) => {
        if (e.target === editModal) {
          this.closeEditModal();
        }
      });
    }

    // Todo item event delegation
    const todoList = document.getElementById("todoList");
    if (todoList) {
      todoList.addEventListener("click", (e) => {
        const todoItem = e.target.closest(".todo-item");
        if (!todoItem) return;

        const todoId = todoItem.dataset.id;

        if (e.target.closest(".toggle-btn")) {
          this.toggleTodo(todoId);
        } else if (e.target.closest(".edit-btn")) {
          this.openEditModal(todoId);
        } else if (e.target.closest(".delete-btn")) {
          this.deleteTodo(todoId);
        }
      });
    }

    // Filter buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleFilter(e));
    });
  }

  initializeFilters() {
    this.currentFilter = "all";
    this.applyFilter();
  }

  async handleAddTodo(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const title = formData.get("title").trim();
    const description = formData.get("description").trim();

    if (!title) {
      this.showAlert("กรุณาใส่หัวข้องาน", "error");
      return;
    }

    this.showLoading(true);

    try {
      const response = await fetch("/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ title, description }),
      });

      const result = await response.json();

      if (result.success) {
        this.showAlert("เพิ่มงานสำเร็จ!", "success");
        e.target.reset();
        // Reload page to show new todo
        window.location.reload();
      } else {
        this.showAlert("เกิดข้อผิดพลาด: " + result.error, "error");
      }
    } catch (error) {
      console.error("Error adding todo:", error);
      this.showAlert("เกิดข้อผิดพลาดในการเพิ่มงาน", "error");
    } finally {
      this.showLoading(false);
    }
  }

  async toggleTodo(todoId) {
    this.showLoading(true);

    try {
      const response = await fetch(`/todos/${todoId}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        // Update UI immediately
        const todoItem = document.querySelector(`[data-id="${todoId}"]`);
        const isCompleted = result.todo.completed;

        todoItem.dataset.completed = isCompleted;

        // Update checkbox
        const checkbox = todoItem.querySelector(".toggle-btn div");
        const checkIcon = todoItem.querySelector(".toggle-btn i");

        if (isCompleted) {
          checkbox.classList.add("bg-green-500", "border-green-500");
          checkbox.classList.remove("border-gray-300");
          if (!checkIcon) {
            checkbox.innerHTML =
              '<i class="fas fa-check text-white text-sm"></i>';
          }
        } else {
          checkbox.classList.remove("bg-green-500", "border-green-500");
          checkbox.classList.add("border-gray-300");
          checkbox.innerHTML = "";
        }

        // Update title and description styling
        const title = todoItem.querySelector(".todo-title");
        const description = todoItem.querySelector(".todo-description");
        const statusBadge = todoItem.querySelector(".status-badge");

        if (isCompleted) {
          title.classList.add("line-through", "text-gray-500");
          if (description) description.classList.add("line-through");
          statusBadge.className =
            "status-badge px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800";
          statusBadge.textContent = "เสร็จแล้ว";
        } else {
          title.classList.remove("line-through", "text-gray-500");
          if (description) description.classList.remove("line-through");
          statusBadge.className =
            "status-badge px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800";
          statusBadge.textContent = "รอดำเนินการ";
        }

        this.updateStatistics();
        this.applyFilter();
      } else {
        this.showAlert("เกิดข้อผิดพลาด: " + result.error, "error");
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
      this.showAlert("เกิดข้อผิดพลาดในการอัปเดตงาน", "error");
    } finally {
      this.showLoading(false);
    }
  }

  openEditModal(todoId) {
    const todoItem = document.querySelector(`[data-id="${todoId}"]`);
    const title = todoItem.querySelector(".todo-title").textContent.trim();
    const descriptionElement = todoItem.querySelector(".todo-description");
    const description = descriptionElement
      ? descriptionElement.textContent.trim()
      : "";

    // Populate form
    document.getElementById("editTodoId").value = todoId;
    document.getElementById("editTitle").value = title;
    document.getElementById("editDescription").value = description;

    // Show modal
    const modal = document.getElementById("editModal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");

    // Focus on title input
    document.getElementById("editTitle").focus();
  }

  closeEditModal() {
    const modal = document.getElementById("editModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  async handleEditTodo(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const todoId =
      formData.get("editTodoId") || document.getElementById("editTodoId").value;
    const title = formData.get("title").trim();
    const description = formData.get("description").trim();

    if (!title) {
      this.showAlert("กรุณาใส่หัวข้องาน", "error");
      return;
    }

    this.showLoading(true);

    try {
      const response = await fetch(`/todos/${todoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ title, description }),
      });

      const result = await response.json();

      if (result.success) {
        this.showAlert("แก้ไขงานสำเร็จ!", "success");
        this.closeEditModal();
        // Reload page to show updated todo
        window.location.reload();
      } else {
        this.showAlert("เกิดข้อผิดพลาด: " + result.error, "error");
      }
    } catch (error) {
      console.error("Error editing todo:", error);
      this.showAlert("เกิดข้อผิดพลาดในการแก้ไขงาน", "error");
    } finally {
      this.showLoading(false);
    }
  }

  async deleteTodo(todoId) {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบงานนี้?")) {
      return;
    }

    this.showLoading(true);

    try {
      const response = await fetch(`/todos/${todoId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        this.showAlert("ลบงานสำเร็จ!", "success");
        // Remove todo item from DOM
        const todoItem = document.querySelector(`[data-id="${todoId}"]`);
        todoItem.remove();

        this.updateStatistics();
        this.checkEmptyState();
      } else {
        this.showAlert("เกิดข้อผิดพลาด: " + result.error, "error");
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
      this.showAlert("เกิดข้อผิดพลาดในการลบงาน", "error");
    } finally {
      this.showLoading(false);
    }
  }

  handleFilter(e) {
    // Update active filter button
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active", "bg-blue-500", "text-white");
      btn.classList.add("text-gray-700");
    });

    e.target.classList.add("active", "bg-blue-500", "text-white");
    e.target.classList.remove("text-gray-700");

    // Set current filter
    this.currentFilter = e.target.id.replace("filter", "").toLowerCase();
    this.applyFilter();
  }

  applyFilter() {
    const todoItems = document.querySelectorAll(".todo-item");

    todoItems.forEach((item) => {
      const isCompleted = item.dataset.completed === "true";
      let show = false;

      switch (this.currentFilter) {
        case "all":
          show = true;
          break;
        case "pending":
          show = !isCompleted;
          break;
        case "completed":
          show = isCompleted;
          break;
      }

      item.style.display = show ? "block" : "none";
    });
  }

  updateStatistics() {
    const todoItems = document.querySelectorAll(".todo-item");
    const total = todoItems.length;
    const completed = document.querySelectorAll(
      '[data-completed="true"]'
    ).length;
    const pending = total - completed;

    document.getElementById("totalTodos").textContent = total;
    document.getElementById("completedTodos").textContent = completed;
    document.getElementById("pendingTodos").textContent = pending;
  }

  checkEmptyState() {
    const todoList = document.getElementById("todoList");
    const todoItems = document.querySelectorAll(".todo-item");

    if (todoItems.length === 0) {
      todoList.innerHTML = `
                <div class="p-12 text-center">
                    <i class="fas fa-clipboard-list text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-medium text-gray-500 mb-2">ยังไม่มีงานในรายการ</h3>
                    <p class="text-gray-400">เริ่มต้นโดยการเพิ่มงานใหม่ด้านบน</p>
                </div>
            `;
    }
  }

  showLoading(show) {
    const spinner = document.getElementById("loadingSpinner");
    if (show) {
      spinner.classList.remove("hidden");
      spinner.classList.add("flex");
    } else {
      spinner.classList.add("hidden");
      spinner.classList.remove("flex");
    }
  }

  showAlert(message, type = "info") {
    // Create alert element
    const alert = document.createElement("div");
    alert.className = `fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;

    // Set alert style based on type
    switch (type) {
      case "success":
        alert.classList.add("bg-green-500", "text-white");
        break;
      case "error":
        alert.classList.add("bg-red-500", "text-white");
        break;
      default:
        alert.classList.add("bg-blue-500", "text-white");
    }

    alert.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

    document.body.appendChild(alert);

    // Animate in
    setTimeout(() => {
      alert.classList.remove("translate-x-full");
    }, 10);

    // Auto remove after 3 seconds
    setTimeout(() => {
      alert.classList.add("translate-x-full");
      setTimeout(() => alert.remove(), 300);
    }, 3000);
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TodoApp();
});
