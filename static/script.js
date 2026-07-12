window.onload = function() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('journal-date');
    if (dateInput) {
        dateInput.value = today;
    }
    loadEntryByDate();
};

function fillBottle(num) {
    for (let i = 1; i <= 6; i++) {
        const bottle = document.getElementById(`bottle-${i}`);
        if (bottle) {
            if (i <= num) {
                bottle.classList.add('filled');
            } else {
                bottle.classList.remove('filled');
            }
        }
    }
}

function addTodo() {
    const input = document.getElementById('todo-input');
    if (!input) return;
    
    const goalText = input.value.trim();
    if (goalText !== "") {
        const list = document.getElementById('todo-list');
        if (!list) return;
        
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox"> <span style="margin-left:5px; flex-grow:1;">${goalText}</span>
            <button onclick="this.parentElement.remove()" style="color:red; border:none; background:none; cursor:pointer; margin-left:10px;">&times;</button>
        `;
        list.appendChild(li);
        input.value = "";
    }
}

function saveEntry() {
    const dateElement = document.getElementById('journal-date');
    const moodElement = document.getElementById('selected-mood');
    const songElement = document.getElementById('song-input');
    const textElement = document.getElementById('journal-text');
    
    if (!dateElement || !textElement) return;

    const todoItems = [];
    document.querySelectorAll('#todo-list li').forEach(li => {
        const span = li.querySelector('span');
        const checkbox = li.querySelector('input');
        if (span && checkbox) {
            todoItems.push({ text: span.innerText, completed: checkbox.checked });
        }
    });

    const data = {
        date: dateElement.value,
        water: document.querySelectorAll('.bottle.filled').length,
        mood: moodElement ? moodElement.innerText : "Current Mood: None",
        song: songElement ? songElement.value : "",
        content: textElement.value,
        todos: JSON.stringify(todoItems) 
    };

    fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(() => {
        alert("Entry saved successfully!");
        window.location.reload();
    })
    .catch(err => console.error("Error saving entry:", err));
}

function loadEntryByDate() {
    const dateElement = document.getElementById('journal-date');
    if (!dateElement) return;
    
    const selectedDate = dateElement.value;
    const list = document.getElementById('todo-list');
    
    fetch(`/get_entry/${selectedDate}`)
    .then(res => res.json())
    .then(data => {
        if (!list) return;
        
        if (data.found) {
            fillBottle(data.water);
            if (document.getElementById('selected-mood')) document.getElementById('selected-mood').innerText = data.mood;
            if (document.getElementById('song-input')) document.getElementById('song-input').value = data.song;
            if (document.getElementById('journal-text')) document.getElementById('journal-text').value = data.content;

            list.innerHTML = ""; 
            if (data.todos) {
                try {
                    const items = JSON.parse(data.todos);
                    items.forEach(item => {
                        const li = document.createElement('li');
                        const goalText = (typeof item === 'object') ? item.text : item;
                        const isChecked = (typeof item === 'object' && item.completed) ? "checked" : "";
                        
                        li.innerHTML = `
                            <input type="checkbox" ${isChecked}> <span style="margin-left:5px; flex-grow:1;">${goalText}</span>
                            <button onclick="this.parentElement.remove()" style="color:red; border:none; background:none; cursor:pointer; margin-left:10px;">&times;</button>
                        `;
                        list.appendChild(li);
                    });
                } catch(e) {
                    console.error("Error parsing goals:", e);
                }
            }
            const saveBtn = document.querySelector('.save-btn');
            if (saveBtn) saveBtn.innerText = "Update Entry";
        } else {
            fillBottle(0);
            if (document.getElementById('selected-mood')) document.getElementById('selected-mood').innerText = "Current Mood: None";
            if (document.getElementById('song-input')) document.getElementById('song-input').value = "";
            if (document.getElementById('journal-text')) document.getElementById('journal-text').value = "";
            list.innerHTML = ""; 
            
            const saveBtn = document.querySelector('.save-btn');
            if (saveBtn) saveBtn.innerText = "Save Day";
        }
    })
    .catch(err => console.error("Error loading values:", err));
}

function setMood(mood) {
    const moodElement = document.getElementById('selected-mood');
    if (moodElement) {
        moodElement.innerText = "Current Mood: " + mood;
    }
}

const micBtn = document.getElementById('mic-btn');
const textArea = document.getElementById('journal-text');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn && textArea) {
    const recognition = new SpeechRecognition();
    micBtn.onclick = () => {
        recognition.start();
        micBtn.innerText = "🛑 Listening...";
    };
    recognition.onresult = (event) => {
        textArea.value += event.results[0][0].transcript + " ";
        micBtn.innerText = "🎙️ Click to Speak";
    };
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const arrow = document.getElementById('toggle-arrow');
    
    if (sidebar && arrow) {
        sidebar.classList.toggle('collapsed');
        
        if (sidebar.classList.contains('collapsed')) {
            arrow.innerHTML = '❯'; 
            arrow.style.left = '0px';
        } else {
            arrow.innerHTML = '❮';
            arrow.style.left = '320px';
        }
    }
}