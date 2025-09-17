/**
 * [
 *    {
 *      id: <int>
 *      task: <string>
 *      timestamp: <string>
 *      isCompleted: <boolean>
 *    }
 * ]
 */
const todos = [];
const RENDER_EVENT = "render-todo";

function generateId() {
  return +new Date();
}

function generateTodoObject(id, task, timestamp, isCompleted) {
  return {
    id,
    task,
    timestamp,
    isCompleted,
  };
}

function findTodo(todoId) {
  for (const todoItem of todos) {
    if (todoItem.id === todoId) {
      return todoItem;
    }
  }
  return null;
}

function findTodoIndex(todoId) {
  for (const index in todos) {
    if (todos[index].id === todoId) {
      return index;
    }
  }
  return -1;
}

function makeTodo(todoObject) {
  const { id, task, timestamp, isCompleted } = todoObject;

  const textTitle = document.createElement("h2");
  textTitle.innerText = task;

  const textTimestamp = document.createElement("p");
  textTimestamp.innerText = timestamp;

  const textContainer = document.createElement("div");
  textContainer.classList.add("inner");
  textContainer.append(textTitle, textTimestamp);

  const container = document.createElement("div");
  container.classList.add("item", "shadow");
  container.append(textContainer);
  container.setAttribute("id", `todo-${id}`);

  if (isCompleted) {
    const undoButton = document.createElement("button");
    undoButton.classList.add("undo-button");
    undoButton.addEventListener("click", function () {
      undoTaskFromCompleted(id);
    });

    const trashButton = document.createElement("button");
    trashButton.classList.add("trash-button");
    trashButton.addEventListener("click", () => {
      showConfigDialog(() => {
        removeTaskFromCompleted(id); // hapus beneran kalau user pilih "Yes"
        showToast(deleteMessage); // kasih notifikasi
      });
    });

    container.append(undoButton, trashButton);
  } else {
    const checkButton = document.createElement("button");
    checkButton.classList.add("check-button");
    checkButton.addEventListener("click", function () {
      addTaskToCompleted(id);
    });

    container.append(checkButton);
  }
  return container;
}

function addTodo() {
  const textTodo = document.getElementById("title").value;
  const timestamp = document.getElementById("date").value;

  if (textTodo.trim() === "" || timestamp.trim() === "") {
    showWarningDialog();
    return;
  }

  const generatedID = generateId();
  const todoObject = generateTodoObject(
    generatedID,
    textTodo,
    timestamp,
    false
  );
  todos.push(todoObject);
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
  showToast(submittedMessage);
  showSuccessDialog();
}

function addTaskToCompleted(todoId /* HTMLELement */) {
  const todoTarget = findTodo(todoId);
  if (todoTarget == null) return;

  todoTarget.isCompleted = true;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
  showToast(checkedMessage);
}

function removeTaskFromCompleted(todoId /* HTMLELement */) {
  const todoTarget = findTodoIndex(todoId);

  if (todoTarget === -1) return;

  todos.splice(todoTarget, 1);
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
  showToast(deleteMessage);
}

function undoTaskFromCompleted(todoId /* HTMLELement */) {
  const todoTarget = findTodo(todoId);

  if (todoTarget == null) return;

  todoTarget.isCompleted = false;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
  showToast(undoMessage);
}

function saveData() {
  if (isStorageExist()) {
    const parsed = JSON.stringify(todos);
    localStorage.setItem(STORAGE_KEY, parsed);
    document.dispatchEvent(new Event(SAVED_EVENT));
  }
}

const SAVED_EVENT = "saved-todo";
const STORAGE_KEY = "TODO-APPS";

function isStorageExist() {
  if (typeof Storage === undefined) {
    alert("Browser kamu tidak mendukung local storage");
    return false;
  }
  return true;
}

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  let data = JSON.parse(serializedData);

  if (data !== null) {
    for (const todo of data) {
      todos.push(todo);
    }
  }
  document.dispatchEvent(new Event(RENDER_EVENT));
}

let toastBox = document.getElementById("toastBox");
let submittedMessage =
  '<i class="fa-solid fa-bookmark"></i> Berhasil ditambahkan!';
let checkedMessage =
  '<i class="fa-solid fa-circle-check"></i> Status berhasil diubah!';
let undoMessage =
  '<i class="fa-solid fa-rotate-left"></i> Status berhasil dikembalikan!';
let deleteMessage = ' <i class="fa-solid fa-trash"></i> Berhasil dihapus!';

function showToast(message) {
  let toastBox = document.getElementById("toastBox");
  if (!toastBox) {
    toastBox = document.createElement("div");
    toastBox.id = "toastBox";
    document.body.appendChild(toastBox);
  }

  // hapus toast lama biar gantian
  toastBox.innerHTML = "";

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = message;

  if (message.includes("ditambahkan")) toast.classList.add("ditambahkan");
  if (message.includes("diubah")) toast.classList.add("diubah");
  if (message.includes("dikembalikan")) toast.classList.add("dikembalikan");
  if (message.includes("dihapus")) toast.classList.add("dihapus");

  toastBox.appendChild(toast);

  const totalTime = 3000; // durasi tampil
  const exitAnimTime = 300; // durasi animasi keluar

  setTimeout(() => {
    toast.classList.add("exit");
  }, totalTime - exitAnimTime);

  setTimeout(() => {
    toast.remove();
  }, totalTime);
}

document.addEventListener(SAVED_EVENT, function () {
  console.log(localStorage.getItem(STORAGE_KEY));
});

document.addEventListener("DOMContentLoaded", function () {
  const submitForm /* HTMLFormElement */ = document.getElementById("form");

  submitForm.addEventListener("submit", function (event) {
    event.preventDefault();
    addTodo();
  });
});

document.addEventListener(RENDER_EVENT, function () {
  const uncompletedTODOList = document.getElementById("todos");
  const listCompleted = document.getElementById("completed-todos");

  // clearing list item
  uncompletedTODOList.innerHTML = "";
  listCompleted.innerHTML = "";

  for (const todoItem of todos) {
    const todoElement = makeTodo(todoItem);
    if (todoItem.isCompleted) {
      listCompleted.append(todoElement);
    } else {
      uncompletedTODOList.append(todoElement);
    }
  }
  updateStatusMessages(todos);
});

function showConfigDialog(onConfirm) {
  const dialog = document.getElementById("confirmDialog");
  dialog.classList.remove("hidden");

  document.getElementById("confirmYes").onclick = () => {
    onConfirm();
    dialog.classList.add("hidden");
  };
  document.getElementById("confirmNo").onclick = () => {
    dialog.classList.add("hidden");
  };
}

function showSuccessDialog(message = "Todo berhasil ditambahkan 🎉") {
  const dialog = document.createElement("div");
  dialog.className = "dialog";
  dialog.innerHTML = `
    <div class="dialog-content">
      <p>${message}</p>
      <div class="emoji">✅</div>
    </div>`;
  document.body.appendChild(dialog);

  setTimeout(() => dialog.remove(), 2000);
}

function showWarningDialog(message = "Form tidak boleh kosong ⚠️") {
  const dialog = document.createElement("div");
  dialog.className = "dialog";
  dialog.innerHTML = `
    <div class="dialog-content">
      <p>${message}</p>
      <div class="emoji">⚠️</div>
    </div>`;
  document.body.appendChild(dialog);

  setTimeout(() => dialog.remove(), 2000);
}

function updateStatusMessages(todos) {
  const statusBox = document.getElementById("statusMessage");
  const total = todos.length;
  const completed = todos.filter((t) => t.isCompleted).length;
  const active = total - completed;

  if (total === 0) {
    statusBox.textContent = "Belum ada todo, ayo tambahkan tugas! ✨";
  } else if (active > 0) {
    statusBox.textContent = `📌 ${active} todo aktif, progress: ${completed}/${total}`;
  } else {
    statusBox.textContent = "🎉 Semua todo selesai! Mantap!";
  }

  const now = new Date();
  const deadlineSoon = todos.find((t) => {
    const deadline = new Date(t.timestamp);
    const diff = (deadline - now) / (1000 * 60 * 60 * 24); // selisih hari
    return diff >= 0 && diff <= 1 && !t.isCompleted; // deadline ≤ 1 hari
  });

  if (deadlineSoon) {
    statusBox.textContent += " ⏰ Ada todo yang mendekati deadline!";
  }
}
