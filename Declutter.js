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

let tasks = JSON.parse(localStorage.getItem('declutter_tasks')) || [];
let deletedCount = parseInt(localStorage.getItem('declutter_deleted')) || 0;
let editedCount = parseInt(localStorage.getItem('declutter_edited')) || 0;
let history = []; 
let currentSort = 'asc';
let editingId = null;
let draggedItemIndex = null;

function addTask() {
    const text = taskInput.value.trim();
    if (text === "") {
        inputWrapper.classList.add('shake-error');
        setTimeout(() => inputWrapper.classList.remove('shake-error'), 400);
        return alert("Your mind is clear. Input a task."); 
    }

    const isDuplicate = tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
    if (isDuplicate) return alert("That idea is already listed!");

    const newTask = { id: Date.now(), text: text, completed: false };

    saveToHistory();
    tasks.push(newTask);
    renderTasks();
    taskInput.value = ""; 
}

function deleteTask(id) {
    if (editingId === id) return;
    const taskToDelete = tasks.find(t => t.id === id);
    if (confirm(`Are you sure do you want to sweep away "${taskToDelete.text}"?`)) {
        saveToHistory();
        tasks = tasks.filter(t => t.id !== id);
        deletedCount++;
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
        alert("That idea already exists!");
        editingId = null;
        renderTasks();
        return;
    }

    saveToHistory();
    taskItem.text = trimmedText;
    editedCount++;
    editingId = null;
    renderTasks();
}

function sortTasks() {
    if (tasks.length < 2) return;
    saveToHistory();
    tasks.sort((a, b) => currentSort === 'asc' ? a.text.localeCompare(b.text) : b.text.localeCompare(a.text));
    currentSort = (currentSort === 'asc') ? 'desc' : 'asc';
    sortBtn.innerText = `SORT_${currentSort.toUpperCase()}`;
    renderTasks();
}

function toggleSelectAll() {
    if (tasks.length === 0) return;
    saveToHistory();
    const allDone = tasks.every(t => t.completed);
    tasks.forEach(t => t.completed = !allDone);
    renderTasks();
}

function resetApp() {
    if (confirm("Reset everything and clear stats?")) {
        saveToHistory();
        tasks = [];
        deletedCount = 0;
        editedCount = 0;
        localStorage.clear();
        renderTasks();
    }
}

function sweepCompleted() {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return alert("Nothing to sweep. Add your task first!");
    if (confirm(`Sweep all ${completedTasks.length} completed items?`)) {
        saveToHistory();
        deletedCount += completedTasks.length;
        tasks = tasks.filter(t => !t.completed);
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
        renderTasks();
    } else {
        alert("Nothing to undo.");
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
        
        let pressTimer;
        li.ontouchstart = () => { pressTimer = setTimeout(() => editTask(task.id), 800); };
        li.ontouchend = () => { clearTimeout(pressTimer); };

        li.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; flex-grow:1;">
                <input type="checkbox" 
                    style="width:20px; height:20px; cursor:pointer; background:white;" 
                    ${task.completed ? 'checked' : ''} 
                    onclick="toggleComplete(${task.id})" 
                    ${isEditing ? 'disabled' : ''}>
                
                ${isEditing ? 
                    `<input type="text" id="edit-input-${task.id}" 
                        style="background:rgba(255,255,255,0.1); border:none; border-bottom:1px solid #fff; color:inherit; font-family:'Space Mono'; font-size:1rem; padding:5px; width:90%; outline:none;"
                        value="${task.text}" 
                        onkeydown="if(event.key==='Enter') handleEditSave(${task.id}, this.value)"
                        onblur="handleEditSave(${task.id}, this.value)">` 
                    : 
                    `<span class="task-text ${task.completed ? 'completed-text' : ''}" 
                        style="cursor:pointer; font-size:1.1rem;"
                        ondblclick="editTask(${task.id})">
                        ${task.text}
                    </span>`
                }
            </div>
            <div style="display:flex; gap:10px;">
                <button class="task-action-btn" onclick="editTask(${task.id})" 
                    ${isEditing ? 'disabled style="opacity:0.5"' : ''}>EDIT</button>
                <button class="task-action-btn" onclick="deleteTask(${task.id})" 
                    ${isEditing ? 'disabled style="opacity:0.5"' : ''}>X</button>
            </div>
        `;
        taskList.appendChild(li);
    });

    totalCounter.innerText = tasks.length;
    doneCounter.innerText = tasks.filter(t => t.completed).length;
    editCounter.innerText = editedCount;
    deleteCounter.innerText = deletedCount;

    localStorage.setItem('declutter_tasks', JSON.stringify(tasks));
    localStorage.setItem('declutter_deleted', deletedCount);
    localStorage.setItem('declutter_edited', editedCount);
}

taskList.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.task-item');
    if (item) {
        draggedItemIndex = item.dataset.index;
        e.target.style.opacity = "0.5";
    }
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
    e.target.style.opacity = "1";
    draggedItemIndex = null;
});

addBtn?.addEventListener('click', addTask);
inlineAddBtn?.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
sortBtn?.addEventListener('click', sortTasks);
resetBtn?.addEventListener('click', sweepCompleted);

const spans = document.querySelectorAll('.controls span');
spans[2]?.addEventListener('click', undo);          
spans[3]?.addEventListener('click', toggleSelectAll); 
spans[5]?.addEventListener('click', resetApp);       

renderTasks();
