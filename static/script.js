// This runs automatically as soon as the page loads
window.onload = function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('journal-date').value = today;
    
    // Immediately try to load today's data if it exists
    loadEntryByDate();
};
// 1. Water Bottle Clicking
function fillBottle(num) {
    for (let i = 1; i <= 6; i++) {
        const bottle = document.getElementById(`bottle-${i}`);
        if (i <= num) {
            bottle.classList.add('filled');
        } else {
            bottle.classList.remove('filled');
        }
    }
}

// 2. Goal List (To-Do)
// 1. ADD GOAL
function addTodo() {
    const input = document.getElementById('todo-input');
    const goalText = input.value.trim();
    if (goalText !== "") {
        const list = document.getElementById('todo-list');
        const li = document.createElement('li');
        // We use backticks `` to wrap the HTML string
        li.innerHTML = `<input type="checkbox"> <span>${goalText}</span>`;
        list.appendChild(li);
        input.value = "";
    }
}

// 2. SAVE EVERYTHING
function saveEntry() {
    const todoItems = [];
    document.querySelectorAll('#todo-list li').forEach(li => {
        todoItems.push({ 
            text: li.querySelector('span').innerText, 
            completed: li.querySelector('input').checked 
        });
    });

    const data = {
        date: document.getElementById('journal-date').value,
        water: document.querySelectorAll('.bottle.filled').length,
        mood: document.getElementById('selected-mood').innerText,
        song: document.getElementById('song-input').value,
        content: document.getElementById('journal-text').value,
        todos: JSON.stringify(todoItems) 
    };

    fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(() => alert("Saved with Checkboxes!"));
}

// 3. LOAD EVERYTHING
function loadEntryByDate() {
    const selectedDate = document.getElementById('journal-date').value;
    
    fetch(`/get_entry/${selectedDate}`)
    .then(res => res.json())
    .then(data => {
        const list = document.getElementById('todo-list');
        
        if (data.found) {
            // 1. Fill the screen with saved data
            fillBottle(data.water);
            document.getElementById('selected-mood').innerText = data.mood;
            document.getElementById('song-input').value = data.song;
            document.getElementById('journal-text').value = data.content;

            // Rebuild the goals
            list.innerHTML = ""; 
            // ... inside your loadEntryByDate fetch data.found block ...
            if (data.todos) {
            const items = JSON.parse(data.todos);
            items.forEach(item => {
                const li = document.createElement('li');
                
                // Safety Check: If it's an object, use .text. If it's just a string, use the string.
                const goalText = (typeof item === 'object') ? item.text : item;
                const isChecked = (typeof item === 'object' && item.completed) ? "checked" : "";
                
                li.innerHTML = `
                    <input type="checkbox" ${isChecked}> 
                    <span>${goalText}</span>
                    <button onclick="this.parentElement.remove()" style="color:red; border:none; background:none; cursor:pointer; margin-left:10px;">&times;</button>
                `;
                list.appendChild(li);
            });
        }
                    document.querySelector('.save-btn').innerText = "Update Entry";
        } else {
            // 2. EMPTY THE SCREEN for a new day
            // This prevents the "29th" from showing "28th" data
            fillBottle(0);
            document.getElementById('selected-mood').innerText = "Current Mood: None";
            document.getElementById('song-input').value = "";
            document.getElementById('journal-text').value = "";
            list.innerHTML = ""; // Clear the to-do list
            document.querySelector('.save-btn').innerText = "Save Day";
        }
    });
}
// 3. Mood Tracker
function setMood(mood) {
    document.getElementById('selected-mood').innerText = "Current Mood: " + mood;
}

// 4. Voice to Text (The Mic)
const micBtn = document.getElementById('mic-btn');
const textArea = document.getElementById('journal-text');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();

    micBtn.onclick = () => {
        recognition.start();
        micBtn.innerText = "🛑 Listening...";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        textArea.value += transcript + " ";
        micBtn.innerText = "🎙️ Click to Speak";
    };
} else {
    alert("Speech recognition is not supported in this browser.");
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const container = document.querySelector('.main-container');
    const arrow = document.getElementById('toggle-arrow');
    
    // Toggle classes to apply our sliding CSS animations
    sidebar.classList.toggle('collapsed');
    container.classList.toggle('sidebar-collapsed');
    
    // Change arrow direction based on if the sidebar is open or closed
    if (sidebar.classList.contains('collapsed')) {
        arrow.innerHTML = '❯'; 
    } else {
        arrow.innerHTML = '❮';
    }
}