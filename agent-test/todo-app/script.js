document.getElementById('add-todo').addEventListener('click', function() {
    const input = document.getElementById('todo-input');
    const todoText = input.value.trim();
    if (todoText !== '') {
        const li = document.createElement('li');
        li.textContent = todoText;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function() {
            li.remove();
        });
        li.appendChild(deleteButton);
        document.getElementById('todo-list').appendChild(li);
        input.value = '';
    }
});