
// Tạo hoặc lấy sessionId
let sessionId = sessionStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('sessionId', sessionId);
}

// Hàm tải lịch sử tin nhắn
async function loadChatHistory() {
    try {
        const response = await fetch('http://localhost:8080/api/qna/history', {
            method: 'GET',
            headers: {
                'X-Session-Id': sessionId
            }
        });

        if (!response.ok) {
            console.error('Failed to load chat history:', response.status);
            return;
        }

        const messages = await response.json();
        const chatBox = document.getElementById('chatBox');
        const chatMessages = chatBox.querySelector('.chat-messages');

        // Xóa tin nhắn mặc định
        chatMessages.innerHTML = '';

        // Thêm tin nhắn từ lịch sử
        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.type}`;
            messageDiv.setAttribute('data-time', msg.time);
            messageDiv.textContent = msg.content;
            chatMessages.appendChild(messageDiv);
        });

        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

// Hàm gửi tin nhắn
async function sendMessage() {
    const input = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');
    const message = input.value.trim();

    if (message) {
        // Add user message
        const userMessage = document.createElement('div');
        userMessage.className = 'message sent';
        userMessage.setAttribute('data-time', new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
        userMessage.textContent = message;
        chatBox.querySelector('.chat-messages').appendChild(userMessage);

        // Add loading indicator
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'message received loading';
        loadingMessage.textContent = 'BookBot đang trả lời...';
        chatBox.querySelector('.chat-messages').appendChild(loadingMessage);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            // Call API
            const response = await fetch('http://localhost:8080/api/qna/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': sessionId
                },
                body: JSON.stringify({ question: message })
            });

            // Remove loading indicator
            loadingMessage.remove();

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Status Text: ${response.statusText}, Response: ${errorText}`);
            }

            const data = await response.text();

            // Add bot response
            const botMessage = document.createElement('div');
            botMessage.className = 'message received';
            botMessage.setAttribute('data-time', new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
            botMessage.textContent = data || 'Xin lỗi, tôi không thể trả lời ngay bây giờ. Hãy thử lại!';
            chatBox.querySelector('.chat-messages').appendChild(botMessage);
        } catch (error) {
            console.error('Error calling API:', error);
            loadingMessage.remove();
            const errorMessage = document.createElement('div');
            errorMessage.className = 'message received';
            errorMessage.setAttribute('data-time', new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
            errorMessage.textContent = `Xin lỗi, có lỗi khi kết nối với BookBot: ${error.message}. Vui lòng thử lại sau!`;
            chatBox.querySelector('.chat-messages').appendChild(errorMessage);
        }

        input.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Tải lịch sử khi trang được tải
document.addEventListener('DOMContentLoaded', loadChatHistory);
