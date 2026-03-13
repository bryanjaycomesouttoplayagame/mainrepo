/*Programmer: Bryan Jay M. Lumabas*/

const taskInput = document.getElementById('taskInput');
const inputWrapper = document.getElementById('inputWrapper');
const taskList = document.getElementById('task-list');

const addBtn = document.getElementById('addBtn');       
const inlineAddBtn = document.getElementById('inlineAddBtn'); 
const sortBtn = document.getElementById('sortAsc');
const resetBtn = document.getElementById('resetBtn');

const totalCounter = document.getElementById('totalTasks');
const doneCounter = document.getElementById('doneTasks');
const editCounter = document.getElementById('editTasks');
const deleteCounter = document.getElementById('deletedTasks');

const statusDisplay = document.querySelector('.app-window p');

let tasks = JSON.parse(localStorage.getItem('declutter_tasks')) || [];
let deletedCount = parseInt(localStorage.getItem('declutter_deleted')) || 0;
let editedCount = parseInt(localStorage.getItem('declutter_edited')) || 0;
let history = []; 
let currentSort = 'asc';
let editingId = null;
let draggedItemIndex = null;

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.cssText = `
        position: fixed;
        top: 50px;
        right: 100px;
        background: ${isError ? '#474747' : '#b7b7b7'};
        color: ${isError ? '#f7f7f7' : '#171717'};
        padding: 15px 25px;
        font-family: 'Space Mono';
        font-size: 0.9rem;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = '0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}

function updateEmotionalStatus() {
    const total = tasks.length;
    const latestTask = total > 0 ? tasks[tasks.length - 1].text.toLowerCase() : "";

    if (latestTask.includes("win") || latestTask.includes("party") || latestTask.includes("dance") || latestTask.includes("celebrate") || latestTask.includes("sing")) {
        statusDisplay.innerText = "STATUS: ECSTATIC";
    } else if (latestTask.includes("change") || latestTask.includes("risk") || latestTask.includes("end") || latestTask.includes("dare") || latestTask.includes("courage")) {
        statusDisplay.innerText = "STATUS: FEARLESS";
    } else if (latestTask.includes("thanks") || latestTask.includes("owe") || latestTask.includes("blessed") || latestTask.includes("appreciate") || latestTask.includes("kind")) {
        statusDisplay.innerText = "STATUS: GRATEFUL";
    } else if (latestTask.includes("dream") || latestTask.includes("learn") || latestTask.includes("bring") || latestTask.includes("become") || latestTask.includes("create")) {
        statusDisplay.innerText = "STATUS: INSPIRED";
    } else if (latestTask.includes("unwind") || latestTask.includes("breathe") || latestTask.includes("coffee") || latestTask.includes("sleep") || latestTask.includes("listen")) {
        statusDisplay.innerText = "STATUS: RELAXED";
    } else if (latestTask.includes("tired") || latestTask.includes("urgent") || latestTask.includes("heavy") || latestTask.includes("much") || latestTask.includes("deadline")) {
        statusDisplay.innerText = "STATUS: EXHAUSTED";
    } else if (latestTask.includes("needs") || latestTask.includes("pain") || latestTask.includes("tears") || latestTask.includes("sad") || latestTask.includes("lonely")) {
        statusDisplay.innerText = "STATUS: HEARTBROKEN";
    } else if (latestTask.includes("didn't") || latestTask.includes("can't") || latestTask.includes("hate") || latestTask.includes("afraid") || latestTask.includes("unsure")) {
        statusDisplay.innerText = "STATUS: INSECURE";
    } else if (latestTask.includes("remember") || latestTask.includes("when") || latestTask.includes("visiting") || latestTask.includes("back") || latestTask.includes("miss")) {
        statusDisplay.innerText = "STATUS: NOSTALGIC";
    } else if (latestTask.includes("stress") || latestTask.includes("hard") || latestTask.includes("need") || latestTask.includes("more") || latestTask.includes("too much")) {
        statusDisplay.innerText = "STATUS: OVERWHELMED";
    } 
    
    else if (total > 15) {
        statusDisplay.innerText = "STATUS: OVERWHELMED";
    } else if (total === 0) {
        statusDisplay.innerText = "STATUS: DECLUTTERING";
    } else {

        statusDisplay.innerText = "STATUS: BRAINSTORMING";
    }
}

function addTask() {
    const text = taskInput.value.trim();
    if (text === "") {
        inputWrapper.classList.add('shake-error');
        setTimeout(() => inputWrapper.classList.remove('shake-error'), 400);
        showToast("ERROR: Feeling empty! Type a task.", true);
        return;
    }
    const isDuplicate = tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
    if (isDuplicate) {
        showToast("ERROR: That particular idea is already listed!", true);
        return;
    }
    saveToHistory();
    const newTask = { id: Date.now(), text: text, completed: false };
    tasks.push(newTask);
    taskInput.value = ""; 
    showToast("SUCCESS: The thought has captured.");
    renderTasks();
}

function deleteTask(id) {
    if (editingId === id) return;
    const taskToDelete = tasks.find(t => t.id === id);
    if (confirm(`Are you sure do you want to sweep away "${taskToDelete.text}"?`)) {
        saveToHistory();
        tasks = tasks.filter(t => t.id !== id);
        deletedCount++;
        showToast("SUCCESS: Eraser was used to wipe the board.");
        renderTasks();
    }
}

function toggleComplete(id) {
    if (editingId === id) return;
    saveToHistory();
    tasks = tasks.map(t => {
        if (t.id === id) t.completed = !t.completed;
        return t;
    });
    renderTasks();
}

function editTask(id) {
    editingId = id;
    renderTasks();
    const input = document.getElementById(`edit-input-${id}`);
    if (input) {
        input.focus();
        const val = input.value;
        input.value = '';
        input.value = val;
    }
}

function handleEditSave(id, newText) {
    const taskItem = tasks.find(t => t.id === id);
    const trimmedText = newText.trim();
    if (trimmedText === "" || trimmedText === taskItem.text) {
        editingId = null;
        renderTasks();
        return;
    }
    const isDuplicate = tasks.some(t => t.text.toLowerCase() === trimmedText.toLowerCase() && t.id !== id);
    if (isDuplicate) {
        showToast("ERROR: That particular idea already exists!", true);
        editingId = null;
        renderTasks();
        return;
    }
    saveToHistory();
    taskItem.text = trimmedText;
    editedCount++;
    editingId = null;
    showToast("SUCCESS: The thought has refined.");
    renderTasks();
}

function sortTasks() {
    if (tasks.length < 2) return showToast("ERROR: Not enough to sort ideas.", true);
    saveToHistory();
    if (currentSort === 'asc') {
        tasks.sort((a, b) => a.text.localeCompare(b.text));
        sortBtn.innerText = "SORT_DESC";
        currentSort = 'desc';
    } else if (currentSort === 'desc') {
        tasks.sort((a, b) => b.text.localeCompare(a.text));
        sortBtn.innerText = "SORT_OG";
        currentSort = 'og';
    } else {
        tasks.sort((a, b) => a.id - b.id);
        sortBtn.innerText = "SORT_ASC";
        currentSort = 'asc';
    }
    renderTasks();
}

function toggleSelectAll() {
    if (tasks.length === 0) return showToast("ERROR: There's nothing to select.", true);
    saveToHistory();
    const allDone = tasks.every(t => t.completed);
    tasks.forEach(t => t.completed = !allDone);
    showToast(allDone ? "SUCCESS: Selections are cleared." : "SUCCESS: All of ideas selected.");
    renderTasks();
}

function resetApp() {
    if (tasks.length === 0 && deletedCount === 0) return showToast("ERROR: Your state of mind is already tidy.", true);
    if (confirm("Reset everything and clear stats?")) {
        saveToHistory();
        tasks = [];
        deletedCount = 0;
        editedCount = 0;
        localStorage.clear();
        showToast("SUCCESS: Full sweeping completed.");
        renderTasks();
    }
}

function sweepCompleted() {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return showToast("ERROR: No finished tasks to sweep.", true);
    if (confirm(`Sweep all ${completedTasks.length} completed items?`)) {
        saveToHistory();
        deletedCount += completedTasks.length;
        tasks = tasks.filter(t => !t.completed);
        showToast(`SUCCESS: ${completedTasks.length} items swept.`);
        renderTasks();
    }
}

function saveToHistory() {
    history.push(JSON.stringify(tasks));
    if (history.length > 20) history.shift();
}

function undo() {
    if (history.length > 0) {
        tasks = JSON.parse(history.pop());
        showToast("SUCCESS: An action can be undone.");
        renderTasks();
    } else {
        showToast("ERROR: There's no reason to go back to.", true);
    }
}

function renderTasks() {
    taskList.innerHTML = "";
    tasks.forEach((task, index) => {
        const isEditing = editingId === task.id;
        const li = document.createElement('div');
        li.className = "task-item";
        li.draggable = !isEditing;
        li.dataset.index = index;
        
        li.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; flex-grow:1;">
                <input type="checkbox" 
                    style="
                        appearance: none;
                        -webkit-appearance: none;
                        width: 20px;
                        height: 20px;
                        cursor: pointer;
                        background-color: #2d2d2d;
                        border: 2px solid #808080;
                        border-radius: 2px;
                        display: grid;
                        place-content: center;
                        transition: all 0.2s ease;
                    "
                    ${task.completed ? 'checked' : ''} 
                    onclick="toggleComplete(${task.id})" 
                    ${isEditing ? 'disabled' : ''}>
                
                <style>
                    input[type="checkbox"]:checked {
                        background-color: #2d2d2d;
                        border-color: #4a4a4a;
                    }
                    input[type="checkbox"]::before {
                        content: "";
                        width: 10px;
                        height: 10px;
                        transform: scale(0);
                        transition: 120ms transform ease-in-out;
                        color: #2d2d2d;
                        background-color: #f2f2f2;
                        clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
                    }
                    input[type="checkbox"]:checked::before {
                        transform: scale(1);
                    }
                    
                    .task-edit-input {
                        background: transparent !important;
                        border: none !important;
                        border-bottom: 2px solid #808080 !important;
                        color: #2d2d2d;
                        font-family: 'Space Mono', monospace;
                        font-size: 1rem;
                        padding: 5px 0;
                        width: 90%;
                        outline: none !important;
                        border-radius: 0 !important;
                    }
                </style>

                ${isEditing ? 
                    `<input type="text" id="edit-input-${task.id}" 
                        class="task-edit-input"
                        value="${task.text}" 
                        onkeydown="if(event.key==='Enter') handleEditSave(${task.id}, this.value)"
                        onblur="handleEditSave(${task.id}, this.value)">` 
                    : 
                    `<span class="task-text ${task.completed ? 'completed-text' : ''}" 
                        ondblclick="editTask(${task.id})">
                        ${task.text}
                    </span>`
                }
            </div>
            <div style="display:flex; gap:10px;">
                <button class="task-action-btn" onclick="editTask(${task.id})" ${isEditing ? 'disabled style="opacity:0.5"' : ''}>
                    <i class="fa-solid fa-marker"></i>
                </button>
                <button class="task-action-btn" onclick="deleteTask(${task.id})" ${isEditing ? 'disabled style="opacity:0.5"' : ''}>
                    <i class="fa-solid fa-eraser"></i>
                </button>
            </div>
        `;
        taskList.appendChild(li);
    });

    totalCounter.innerText = tasks.length;
    doneCounter.innerText = tasks.filter(t => t.completed).length;
    editCounter.innerText = editedCount;
    deleteCounter.innerText = deleteCounter.innerText = deletedCount;
    updateEmotionalStatus();
    localStorage.setItem('declutter_tasks', JSON.stringify(tasks));
    localStorage.setItem('declutter_deleted', deletedCount);
    localStorage.setItem('declutter_edited', editedCount);
}

taskList.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.task-item');
    if (item) { draggedItemIndex = item.dataset.index; e.target.style.opacity = "0.5"; }
});
taskList.addEventListener('dragover', (e) => e.preventDefault());
taskList.addEventListener('drop', (e) => {
    e.preventDefault();
    const targetItem = e.target.closest('.task-item');
    if (!targetItem || draggedItemIndex === null) return;
    const droppedItemIndex = targetItem.dataset.index;
    if (draggedItemIndex !== droppedItemIndex) {
        saveToHistory();
        const movedItem = tasks.splice(draggedItemIndex, 1)[0];
        tasks.splice(droppedItemIndex, 0, movedItem);
        renderTasks();
    }
});
taskList.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('task-item')) e.target.style.opacity = "1";
    draggedItemIndex = null;
});

document.getElementById('addBtn')?.addEventListener('click', addTask);
document.getElementById('inlineAddBtn')?.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
document.getElementById('sortAsc')?.addEventListener('click', sortTasks);
document.getElementById('undoBtn')?.addEventListener('click', undo);
document.getElementById('selectAllBtn')?.addEventListener('click', toggleSelectAll);
document.getElementById('resetBtn')?.addEventListener('click', sweepCompleted);
document.getElementById('clearAllBtn')?.addEventListener('click', resetApp);
renderTasks();
;

window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && document.activeElement !== taskInput) {
        const selectedCount = tasks.filter(t => t.completed).length;
        if (selectedCount > 0) {
            if (confirm(`Sweep away all ${selectedCount} selected tasks?`)) {
                sweepCompleted(); 
            }
        }
    }
});

let pressTimer;

taskList.addEventListener('touchstart', (e) => {
    const item = e.target.closest('.task-item');
    if (item && !editingId) {
        const index = item.dataset.index;
        const id = tasks[index].id;
        pressTimer = window.setTimeout(() => {
            editTask(id);
            if (window.navigator.vibrate) window.navigator.vibrate(50);
        }, 600);
    }
}, { passive: true });

taskList.addEventListener('touchend', () => clearTimeout(pressTimer));
taskList.addEventListener('touchmove', () => clearTimeout(pressTimer));
