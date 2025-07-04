// --- Global State ---
let currentChart = null;
let currentAnalysisResult = { input: null, output: null, type: null };
let currentPage = 'home'; // Track current page
let appSettings = {
  model: "hf.co/shishirahm3d/banglamind-8b-instruct-bnb-4bit-q4km-GGUF:latest",
  apiUrl: "http://ai.shishirahmed.me:11435/",
  temperature: 0.8,
};
const API_CONFIG = {
  settingsEndpoint: "./api/settings.php",
  mainAIEndpoint: "./api/chat.php",
  saveEndpoint: "./api/save_chat.php",
  loadEndpoint: "./api/load_chat.php",
  historyEndpoint: "./api/chat_history.php",
  deleteEndpoint: "./api/delete_chat.php",
  renameEndpoint: "./api/rename_chat.php",
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
  loadSettings();
  initDarkMode();
  loadChatHistory();
  setMinDate();
});

function initializeApp() { 
  // Initialize on home page
  showPage('home');
  // Add some initial animation
  document.querySelector('.app-container').style.opacity = '0';
  setTimeout(() => {
    document.querySelector('.app-container').style.transition = 'opacity 0.5s ease';
    document.querySelector('.app-container').style.opacity = '1';
  }, 100);
}

function setMinDate() {
  // Set minimum date to today for predictive analysis
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('scheduledDate').min = today;
  document.getElementById('scheduledDate').value = today;
}

function initDarkMode() {
  const darkModeEnabled = localStorage.getItem("darkMode") === "true";
  if (darkModeEnabled) {
      document.body.classList.add("dark-mode");
      document.getElementById("themeIcon").classList.replace("fa-moon", "fa-sun");
  }
}

function setupEventListeners() {
  const tempSlider = document.getElementById("temperatureInput");
  const tempValue = document.getElementById("temperatureValue");
  if (tempSlider) {
    tempSlider.addEventListener("input", function() { 
      tempValue.textContent = this.value;
    });
  }
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key) {
        case '0':
          e.preventDefault();
          showPage('home');
          break;
        case '1':
          e.preventDefault();
          showPage('influencer');
          break;
        case '2':
          e.preventDefault();
          showPage('sentiment');
          break;
        case '3':
          e.preventDefault();
          showPage('predictive');
          break;
        case '4':
          e.preventDefault();
          showPage('youtube');
          break;
        case 's':
          e.preventDefault();
          if (currentAnalysisResult.output) saveCurrentAnalysis();
          break;
      }
    }
  });
}

// --- UI Interaction ---
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
  const themeIcon = document.getElementById("themeIcon");
  themeIcon.classList.toggle("fa-moon");
  themeIcon.classList.toggle("fa-sun");
  if (currentChart) { currentChart.destroy(); currentChart = null; }
}
function toggleSidebar() { document.getElementById("sidebar").classList.toggle("open"); }
function showLoading(message) {
    document.getElementById('loadingText').textContent = message;
    document.getElementById("loadingModal").style.display = "flex";
}
function hideLoading() { document.getElementById("loadingModal").style.display = "none"; }
function showInputTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`${tabName}-input`).classList.add('active');
    document.querySelector(`.tab-btn[onclick="showInputTab('${tabName}')"]`).classList.add('active');
}
function handleFileUpload(textareaId, event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => { document.getElementById(textareaId).value = e.target.result; };
        reader.readAsText(file);
    }
}

// --- Page Navigation ---
function showPage(pageId) {
  // Hide all pages
  const pages = document.querySelectorAll('.page-container');
  pages.forEach(page => {
    page.classList.remove('active');
  });
  
  // Show selected page
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }
  
  // Update navigation state
  updateNavigationState(pageId);
  
  // Update current page
  currentPage = pageId;
  
  // Show/hide action buttons based on page
  updateActionButtons(pageId);
  
  // Clear any existing charts when switching pages
  if (currentChart && pageId !== currentPage) {
    currentChart.destroy();
    currentChart = null;
  }
}

function updateNavigationState(activePageId) {
  // Update sidebar navigation
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-page') === activePageId) {
      item.classList.add('active');
    }
  });
}

function updateActionButtons(pageId) {
  const saveBtn = document.getElementById('saveBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const clearBtn = document.getElementById('clearBtn');
  
  if (pageId === 'home') {
    // Hide action buttons on home page
    if (saveBtn) saveBtn.style.display = 'none';
    if (downloadBtn) downloadBtn.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
  } else {
    // Show action buttons on analysis pages if there are results
    if (currentAnalysisResult.output) {
      if (saveBtn) saveBtn.style.display = 'block';
      if (downloadBtn) downloadBtn.style.display = 'block';
      if (clearBtn) clearBtn.style.display = 'block';
    }
  }
}

// --- Helper Functions ---
function extractJsonFromString(text) {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```|({[\s\S]*}|\[[\s\S]*\])/;
    const match = text.match(jsonRegex);
    if (match) return match[1] || match[2];
    return null;
}

function formatInfluencerResults(influencers) {
    let tableRows = influencers.map(inf => `
        <tr>
            <td>${inf.name || 'N/A'}</td>
            <td>${inf.followers || 'N/A'}</td>
            <td>${inf.engagementRate || 'N/A'}%</td>
            <td>${inf.activity || 'N/A'}</td>
        </tr>
    `).join('');
    return `<h4>Influencer Analysis Results</h4><p>The following potential influencers were identified.</p><table class="influencer-table"><thead><tr><th>Name</th><th>Followers</th><th>Engagement</th><th>Activity</th></tr></thead><tbody>${tableRows}</tbody></table>`;
}

function formatSentimentResults(data) {
    const overallSentiment = data.overall_sentiment || 'Unavailable';
    const explanation = data.explanation || 'No explanation provided.';
    const positive = data.positive_percent || 0;
    const negative = data.negative_percent || 0;
    const neutral = data.neutral_percent || 0;
    const colorClass = `prediction-${overallSentiment}`;

    return `<h4>Overall Sentiment: <span class="${colorClass}">${overallSentiment}</span></h4><p><strong>AI Explanation:</strong> ${explanation}</p><h5>Sentiment Breakdown</h5><div class="sentiment-breakdown-container"><div class="sentiment-breakdown-item"><span>Positive</span><div class="progress-bar-container"><div class="progress-bar positive" style="width: ${positive}%;"></div></div><span>${positive}%</span></div><div class="sentiment-breakdown-item"><span>Negative</span><div class="progress-bar-container"><div class="progress-bar negative" style="width: ${negative}%;"></div></div><span>${negative}%</span></div><div class="sentiment-breakdown-item"><span>Neutral</span><div class="progress-bar-container"><div class="progress-bar neutral" style="width: ${neutral}%;"></div></div><span>${neutral}%</span></div></div>`;
}

function formatPredictiveResults(data) {
    const outcome = data.outcome || 'Unavailable';
    const situations = data.situations || 'N/A';
    const events = data.events || 'N/A';
    const recommendations = data.recommendations || [];
    const colorClass = `prediction-${outcome}`;
    let recommendationsHtml = recommendations.map(rec => `<li>${rec}</li>`).join('');
    return `<h4>Predicted Outcome: <span class="${colorClass}">${outcome}</span></h4><p><strong>Potential Situations/Opportunities:</strong><br>${situations}</p><p><strong>Likely Events/Conditions:</strong><br>${events}</p><h5>Recommended Actions</h5><ul>${recommendationsHtml.length > 0 ? recommendationsHtml : '<li>No specific recommendations provided.</li>'}</ul>`;
}

// --- Charting Logic ---
function renderSentimentChart(chartType, chartData, chartOptions = {}) {
    const sentimentChart = Chart.getChart('sentimentChart');
    if (sentimentChart) { sentimentChart.destroy(); }
    
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#ffffff' : '#333333';
    
    new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: {
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { 
                legend: { labels: { color: textColor } },
                ...chartOptions.plugins
            },
            scales: chartType === 'bar' ? {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: { ticks: { color: textColor }, grid: { color: gridColor } }
            } : {}, 
            ...chartOptions
        }
    });
}

function renderPredictiveSummary(prediction) {
    const summaryCard = document.getElementById('prediction-visual-summary');
    const predictiveChart = document.getElementById('predictiveChart');
    
    predictiveChart.style.display = 'none';
    summaryCard.style.display = 'flex';
    summaryCard.style.flexDirection = 'column';
    summaryCard.style.alignItems = 'center';
    summaryCard.style.justifyContent = 'center';
    
    const outcome = prediction.outcome || "Neutral";
    const colorClass = `prediction-${outcome}`;
    const icons = { Positive: 'fa-thumbs-up', Negative: 'fa-thumbs-down', Neutral: 'fa-meh', Mixed: 'fa-balance-scale' };
    summaryCard.innerHTML = `<i class="fas ${icons[outcome] || 'fa-meh'} ${colorClass}"></i><h4 class="${colorClass}">${outcome}</h4>`;
}

function clearSentimentResults() {
    const sentimentChart = Chart.getChart('sentimentChart');
    if (sentimentChart) { sentimentChart.destroy(); }
    
    document.getElementById('sentiment-text-results').innerHTML = `
        <div class="placeholder-content">
            <i class="fas fa-heart" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 16px;"></i>
            <h4>Ready for Sentiment Analysis</h4>
            <p>Provide text content to analyze emotional tone and sentiment distribution.</p>
        </div>
    `;
}

function clearPredictiveResults() {
    const predictiveChart = Chart.getChart('predictiveChart');
    if (predictiveChart) { predictiveChart.destroy(); }
    
    document.getElementById('predictiveChart').style.display = 'none';
    document.getElementById('prediction-visual-summary').style.display = 'none';
    
    document.getElementById('predictive-text-results').innerHTML = `
        <div class="placeholder-content">
            <i class="fas fa-crystal-ball" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 16px;"></i>
            <h4>Ready for Predictive Analysis</h4>
            <p>Provide news data and social media trends to generate future predictions.</p>
        </div>
    `;
}

function renderChart(chartType, chartData, chartOptions = {}) {
    if (currentChart) { currentChart.destroy(); }
    document.getElementById('resultsChart').style.display = 'block';
    document.getElementById('prediction-visual-summary').style.display = 'none';
    const ctx = document.getElementById('resultsChart').getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#ffffff' : '#333333';
    currentChart = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor } } },
            scales: chartType === 'bar' ? {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: { ticks: { color: textColor }, grid: { color: gridColor } }
            } : {}, ...chartOptions
        }
    });
}
function renderPredictionSummary(prediction) {
    const summaryCard = document.getElementById('prediction-visual-summary');
    const predictiveChart = document.getElementById('predictiveChart');
    
    predictiveChart.style.display = 'none';
    summaryCard.style.display = 'flex';
    summaryCard.style.flexDirection = 'column';
    summaryCard.style.alignItems = 'center';
    summaryCard.style.justifyContent = 'center';
    
    const outcome = prediction.outcome || "Neutral";
    const colorClass = `prediction-${outcome}`;
    const icons = { Positive: 'fa-thumbs-up', Negative: 'fa-thumbs-down', Neutral: 'fa-meh', Mixed: 'fa-balance-scale' };
    summaryCard.innerHTML = `<i class="fas ${icons[outcome] || 'fa-meh'} ${colorClass}"></i><h4 class="${colorClass}">${outcome}</h4>`;
}
function clearResults() {
    // Clear based on current page
    if (currentPage === 'sentiment') {
        clearSentimentResults();
    } else if (currentPage === 'predictive') {
        clearPredictiveResults();
    } else if (currentPage === 'youtube') {
        clearYouTubeResults();
    } else if (currentPage === 'influencer') {
        // Clear influencer results
        if (currentChart) { currentChart.destroy(); currentChart = null; }
        document.getElementById('resultsChart').style.display = 'block';
        document.getElementById('ai-text-results').innerHTML = `
            <div class="placeholder-content">
                <i class="fas fa-users" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 16px;"></i>
                <h4>Ready for Influencer Analysis</h4>
                <p>Provide social media data to identify potential influencers and analyze their metrics.</p>
            </div>
        `;
    }
    
    // Hide action buttons
    updateActionButtons(currentPage);
    currentAnalysisResult = { input: null, output: null, type: null };
    showNotification('Results cleared', 'info');
}

// Add notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out forwards';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

// --- API Calls & Feature Logic ---
async function callAIPredictionAPI(task, inputData) {
    showLoading(`Running ${task.replace(/_/g, ' ')}...`);
    try {
        const response = await fetch(API_CONFIG.mainAIEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task, data: inputData, model: appSettings.model,
                apiUrl: appSettings.apiUrl, parameters: { temperature: appSettings.temperature },
            }),
        });
        const responseText = await response.text();
        let data;
        try { data = JSON.parse(responseText); }
        catch (e) { throw new Error("Server returned an invalid response. Check console (F12) for details."); }
        if (!response.ok || !data.success) { throw new Error(data.error || `An unknown server error occurred.`); }
        currentAnalysisResult = { input: inputData, output: data.response, type: task };
        return data.response;
    } catch (error) {
        document.getElementById('ai-text-results').innerHTML = `<p style="color: red;">${error.message}</p>`;
        return null;
    } finally { hideLoading(); }
}

async function analyzeInfluencers() {
    clearResults();
    const text = document.getElementById('influencerTextInput').value.trim();
    if (!text) { 
        showNotification("Please enter data for influencer analysis.", 'error');
        return; 
    }
    
    const aiResponse = await callAIPredictionAPI('influencer_identification', text);
    if (!aiResponse) return;
    
    try {
        const jsonString = extractJsonFromString(aiResponse);
        if (!jsonString) throw new Error("No JSON found in the AI response.");
        const influencers = JSON.parse(jsonString);
        document.getElementById('ai-text-results').innerHTML = formatInfluencerResults(influencers);
        
        if (!Array.isArray(influencers) || influencers.length === 0) {
            showNotification("No influencers found in the provided data.", 'info');
            return;
        }
        
        const labels = influencers.map(i => i.name || 'Unknown');
        const data = influencers.map(i => {
            const followers = String(i.followers || '0').toUpperCase();
            if (followers.includes('M')) return parseFloat(followers) * 1000000;
            if (followers.includes('K')) return parseFloat(followers) * 1000;
            return parseInt(followers.replace(/,/g, '')) || 0;
        });
        
        renderChart('bar', {
            labels, 
            datasets: [{ 
                label: 'Follower Count', 
                data, 
                backgroundColor: 'rgba(59, 130, 246, 0.7)', 
                borderColor: 'rgba(59, 130, 246, 1)', 
                borderWidth: 2,
                borderRadius: 8
            }]
        }, { 
            indexAxis: 'y',
            plugins: {
                title: {
                    display: true,
                    text: 'Influencer Reach Analysis'
                }
            }
        });
        
        showNotification(`Found ${influencers.length} potential influencers!`, 'success');
    } catch (e) {
        document.getElementById('ai-text-results').innerText = aiResponse;
        document.getElementById('ai-text-results').innerHTML += `<br><p style="color:orange;">Could not format results: ${e.message}</p>`;
        showNotification("Analysis completed but formatting failed.", 'error');
    }
}

async function performSentimentAnalysis() {
    clearSentimentResults();
    const text = document.getElementById('sentimentTextInput').value.trim();
    if (!text) { 
        showNotification("Please enter text for sentiment analysis.", 'error');
        return; 
    }
    
    const aiResponse = await callAIPredictionAPI('sentiment_analysis', text);
    if (!aiResponse) return;
    
    try {
        const jsonString = extractJsonFromString(aiResponse);
        if (!jsonString) throw new Error("No JSON found in the AI response.");
        const sentiment = JSON.parse(jsonString);
        document.getElementById('sentiment-text-results').innerHTML = formatSentimentResults(sentiment);
        
        const sentimentData = {
            'Positive': sentiment.positive_percent || 0,
            'Negative': sentiment.negative_percent || 0,
            'Neutral': sentiment.neutral_percent || 0
        };
        
        renderSentimentChart('doughnut', {
            labels: Object.keys(sentimentData),
            datasets: [{
                label: 'Sentiment Distribution',
                data: Object.values(sentimentData),
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(245, 158, 11, 1)'
                ],
                borderWidth: 2
            }]
        }, {
            plugins: {
                title: {
                    display: true,
                    text: 'Sentiment Distribution Analysis'
                }
            }
        });
        
        const overallSentiment = sentiment.overall_sentiment || 'Neutral';
        showNotification(`Analysis complete! Overall sentiment: ${overallSentiment}`, 'success');
    } catch (e) {
        document.getElementById('ai-text_results').innerText = aiResponse;
        document.getElementById('ai-text_results').innerHTML += `<br><p style="color:orange;">Could not format results: ${e.message}</p>`;
        showNotification("Analysis completed but formatting failed.", 'error');
    }
}

async function predictSituation() {
    clearPredictiveResults();
    const newsData = document.getElementById('newsInput').value.trim();
    const youtubeData = document.getElementById('youtubeInput').value.trim();
    const scheduledDate = document.getElementById('scheduledDate').value;
    
    if (!newsData && !youtubeData) { 
        showNotification("Please provide data for prediction.", 'error');
        return; 
    }
    if (!scheduledDate) { 
        showNotification("Please select a target date.", 'error');
        return; 
    }
    
    const inputData = { news: newsData, youtube: youtubeData, socialMedia: '', date: scheduledDate };
    const aiResponse = await callAIPredictionAPI('predictive_situation', inputData);
    if (!aiResponse) return;
    
    try {
        const jsonString = extractJsonFromString(aiResponse);
        if (!jsonString) throw new Error("No JSON found in the AI response.");
        const prediction = JSON.parse(jsonString);
        document.getElementById('predictive-text-results').innerHTML = formatPredictiveResults(prediction);
        renderPredictiveSummary(prediction);
        
        const outcome = prediction.outcome || 'Neutral';
        const selectedDate = new Date(scheduledDate).toLocaleDateString();
        showNotification(`Prediction complete for ${selectedDate}! Outcome: ${outcome}`, 'success');
    } catch (e) {
        document.getElementById('predictive-text-results').innerText = aiResponse;
        document.getElementById('predictive-text-results').innerHTML += `<br><p style="color:orange;">Could not format results: ${e.message}</p>`;
        showNotification("Prediction completed but formatting failed.", 'error');
    }
}

// --- History, Save/Load, and Settings ---
async function saveCurrentAnalysis() {
    if (!currentAnalysisResult.output) { 
        showNotification("Please run an analysis before saving.", 'error');
        return; 
    }
    
    const logTitle = `${currentAnalysisResult.type.replace(/_/g, ' ')} on ${new Date().toLocaleDateString()}`;
    const messages = [
        { role: 'analysis_type', content: currentAnalysisResult.type },
        { role: 'user_input', content: JSON.stringify(currentAnalysisResult.input) },
        { role: 'ai_output', content: currentAnalysisResult.output }
    ];
    
    try {
        showLoading('Saving analysis...');
        const response = await fetch(API_CONFIG.saveEndpoint, {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages, customTitle: logTitle }),
        });
        const data = await response.json();
        hideLoading();
        
        if (data.success) { 
            showNotification("Analysis saved successfully!", 'success');
            loadChatHistory(); 
        } else { 
            showNotification("Error saving analysis: " + data.error, 'error');
        }
    } catch (error) { 
        hideLoading();
        showNotification("Error saving analysis.", 'error');
    }
}
function downloadLog() {
    if (!currentAnalysisResult.output) { 
        showNotification("No analysis to download.", 'error');
        return; 
    }
    
    const logTitle = `${currentAnalysisResult.type.replace(/_/g, ' ')} Report`;
    let logContent = `${logTitle}\n================================\n\n`;
    logContent += `ANALYSIS TYPE:\n${currentAnalysisResult.type}\n\n`;
    logContent += `USER INPUT:\n${typeof currentAnalysisResult.input === 'object' ? JSON.stringify(currentAnalysisResult.input, null, 2) : currentAnalysisResult.input}\n\n`;
    logContent += `AI OUTPUT:\n${currentAnalysisResult.output}\n\n`;
    logContent += `Generated on: ${new Date().toLocaleString()}\n`;
    logContent += `Generated by: Falcon-24 AI Analytics Dashboard`;
    
    const blob = new Blob([logContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentAnalysisResult.type}_report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification("Report downloaded successfully!", 'success');
}
async function loadChatHistory() {
  try {
    const response = await fetch(API_CONFIG.historyEndpoint);
    const data = await response.json();
    if (data.success) {
      const historyList = document.getElementById("chatHistoryList");
      historyList.innerHTML = "";
      data.chats.forEach((chat) => {
        const chatItem = document.createElement("div");
        chatItem.className = "chat-history-item";
        chatItem.textContent = chat.title;
        chatItem.onclick = () => loadAnalysis(chat.filename);
        historyList.appendChild(chatItem);
      });
    }
  } catch (error) { console.error("Error loading history:", error); }
}
async function loadAnalysis(filename) {
    try {
        const response = await fetch(API_CONFIG.loadEndpoint, {
            method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({filename})
        });
        const data = await response.json();
        if(data.success && data.messages) {
            const output = data.messages.find(m => m.role === 'ai_output');
            if(output) {
                clearResults();
                // This is a simplified load. For full functionality, we'd need to re-run the formatting and charting logic.
                document.getElementById('ai-text-results').innerText = output.content;
                alert("Text results loaded. Re-rendering chart and formatted text from logs is not yet fully implemented.");
            }
        } else { alert("Failed to load analysis: " + data.error); }
    } catch(e) { alert("Error loading analysis log."); }
}
function openSettings() {
  document.getElementById("modelInput").value = appSettings.model;
  document.getElementById("apiUrlInput").value = appSettings.apiUrl;
  document.getElementById("temperatureInput").value = appSettings.temperature;
  document.getElementById("temperatureValue").textContent = appSettings.temperature;
  document.getElementById("settingsModal").style.display = "flex";
}
function closeSettings() { document.getElementById("settingsModal").style.display = "none"; }
async function saveSettings() {
  appSettings.model = document.getElementById("modelInput").value.trim();
  appSettings.apiUrl = document.getElementById("apiUrlInput").value.trim();
  appSettings.temperature = parseFloat(document.getElementById("temperatureInput").value);
  
  if (!appSettings.model || !appSettings.apiUrl) {
    showNotification("Please fill in all required fields.", 'error');
    return;
  }
  
  try {
    const response = await fetch(API_CONFIG.settingsEndpoint, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appSettings)
    });
    const data = await response.json();
    if (data.success) { 
      showNotification("Settings saved successfully!", 'success');
      closeSettings(); 
    } else { 
      showNotification("Error saving settings: " + data.error, 'error');
    }
  } catch (error) { 
    showNotification("Error saving settings.", 'error');
  }
}
async function loadSettings() {
  try {
    const response = await fetch(API_CONFIG.settingsEndpoint);
    const data = await response.json();
    if (data.success && data.settings) { appSettings = { ...appSettings, ...data.settings }; }
  } catch (error) { console.error("Error loading settings:", error); }
}
function openRenameModal() { alert("Not implemented"); }
function closeRenameModal() {}
function deleteSelectedChat() { alert("Not implemented"); }
function renameChat() { alert("Not implemented"); }

// --- YouTube Subtitle Extraction ---
function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

async function extractYouTubeSubtitles() {
    clearYouTubeResults();
    const videoUrl = document.getElementById('youtubeUrl').value.trim();
    
    if (!videoUrl) {
        showNotification("Please enter a YouTube video URL.", 'error');
        return;
    }
    
    // Validate YouTube URL format
    const isValidYouTubeUrl = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/.test(videoUrl);
    if (!isValidYouTubeUrl) {
        showNotification("Invalid YouTube URL. Please check the URL format.", 'error');
        return;
    }
    
    try {
        showLoading('Extracting subtitles from YouTube...');
        
        console.log('Sending request to extract subtitles for:', videoUrl);
        
        // Call our PHP proxy which will call the external transcript API
        const subtitleResponse = await fetch('./api/youtube_subtitles.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: videoUrl
            })
        });
        
        console.log('Response status:', subtitleResponse.status);
        
        if (!subtitleResponse.ok) {
            throw new Error(`HTTP error! status: ${subtitleResponse.status}`);
        }
        
        const subtitleData = await subtitleResponse.json();
        console.log('Subtitle data:', subtitleData);
        
        if (!subtitleData.success) {
            throw new Error(subtitleData.error || 'Failed to extract subtitles.');
        }
        
        // Get video title using a simple method
        const videoId = extractVideoId(videoUrl);
        const videoTitle = await getVideoTitle(videoId) || 'YouTube Video';
        const subtitleText = subtitleData.subtitles;
        const actualLanguage = subtitleData.language || 'English';
        const note = subtitleData.message;
        
        // Display subtitles with language info and any notes
        let noteHtml = '';
        if (note && note !== 'English subtitle found') {
            noteHtml = `<div style="margin-top: 8px; padding: 8px; background: rgba(255, 193, 7, 0.1); border-left: 3px solid #ffc107; border-radius: 4px;">
                <i class="fas fa-info-circle" style="color: #ffc107; margin-right: 8px;"></i>
                <span style="color: #ffc107; font-size: 0.85rem;">${note}</span>
            </div>`;
        }
        
        document.getElementById('subtitle-output').innerHTML = `
            <div style="margin-bottom: 12px; padding: 8px 12px; background: var(--border-color); border-radius: 8px;">
                <h4 style="margin: 0; color: var(--text-primary); font-size: 1rem;">${videoTitle}</h4>
                <p style="margin: 2px 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">Language: ${actualLanguage}</p>
                ${noteHtml}
            </div>
            <div style="white-space: pre-wrap; line-height: 1.6;">${subtitleText}</div>
        `;
        
        document.getElementById('copySubtitlesBtn').style.display = 'inline-flex';
        
        // Now generate AI summary
        await generateYouTubeSummary(subtitleText, videoTitle);
        
        showNotification('Subtitles extracted successfully!', 'success');
        
    } catch (error) {
        console.error('Error extracting subtitles:', error);
        let errorMessage = error.message;
        let helpText = '';
        
        // Provide helpful error messages based on common issues
        if (errorMessage.includes('No captions available') || errorMessage.includes('transcript')) {
            helpText = 'Try checking if the video has captions enabled, or try a different video.';
        } else if (errorMessage.includes('private') || errorMessage.includes('unavailable')) {
            helpText = 'This video may be private, age-restricted, or unavailable in your region.';
        } else if (errorMessage.includes('Network error') || errorMessage.includes('HTTP error')) {
            helpText = 'Please check your internet connection and try again.';
        } else if (errorMessage.includes('Invalid YouTube URL')) {
            helpText = 'Please make sure you entered a valid YouTube video URL.';
        } else {
            helpText = 'Please try again with a different video or check your internet connection.';
        }
        
        document.getElementById('subtitle-output').innerHTML = `
            <div class="placeholder-content">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-color); margin-bottom: 16px;"></i>
                <h4>Error Extracting Subtitles</h4>
                <p style="color: var(--error-color); margin-bottom: 12px;">${errorMessage}</p>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">${helpText}</p>
            </div>
        `;
        showNotification(`Error: ${errorMessage}`, 'error');
    } finally {
        hideLoading();
    }
}

async function getVideoTitle(videoId) {
    try {
        // Simple method to get video title without API
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        const data = await response.json();
        return data.title || 'YouTube Video';
    } catch (error) {
        return 'YouTube Video';
    }
}

async function generateYouTubeSummary(subtitleText, videoTitle) {
    try {
        // Create a formatted input that includes video title and subtitle text
        const inputData = `Video Title: ${videoTitle}\n\nTranscript:\n${subtitleText}`;
        
        const aiResponse = await callAIPredictionAPI('youtube_summary', inputData);
        
        if (aiResponse) {
            // Trim whitespace and clean up the response
            const cleanResponse = aiResponse.trim();
            
            // Convert markdown-style bold text (**text**) to HTML bold tags
            const formattedResponse = cleanResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            // Insert the summary with formatted bold text
            document.getElementById('youtube-text-results').innerHTML = formattedResponse;
            document.getElementById('copySummaryBtn').style.display = 'inline-flex';
            
            // Update current analysis result for saving
            currentAnalysisResult = {
                input: { videoTitle, subtitleText },
                output: aiResponse,
                type: 'youtube_summary'
            };
            
            // Show action buttons
            updateActionButtons(currentPage);
        }
    } catch (error) {
        document.getElementById('youtube-text-results').innerHTML = `
            <div class="placeholder-content">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-color); margin-bottom: 16px;"></i>
                <h4>Error Generating Summary</h4>
                <p style="color: var(--error-color);">Failed to generate AI summary: ${error.message}</p>
            </div>
        `;
        showNotification('Error generating summary: ' + error.message, 'error');
    }
}

function clearYouTubeResults() {
    document.getElementById('subtitle-output').innerHTML = `
        <div class="placeholder-content">
            <i class="fas fa-closed-captioning" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 16px;"></i>
            <h4>Ready for Subtitle Extraction</h4>
            <p>Provide a YouTube video URL to extract subtitles.</p>
        </div>
    `;
    
    document.getElementById('youtube-text-results').innerHTML = `
        <div class="placeholder-content">
            <i class="fas fa-file-alt" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 16px;"></i>
            <h4>Ready for AI Summary</h4>
            <p>Extract subtitles first, then AI will generate a comprehensive summary.</p>
        </div>
    `;
    
    document.getElementById('copySubtitlesBtn').style.display = 'none';
    document.getElementById('copySummaryBtn').style.display = 'none';
}

// --- Copy to Clipboard Function ---
async function copyToClipboard(elementId) {
    try {
        const element = document.getElementById(elementId);
        const text = element.innerText || element.textContent;
        
        await navigator.clipboard.writeText(text);
        showNotification('Content copied to clipboard!', 'success');
    } catch (error) {
        // Fallback for older browsers
        const element = document.getElementById(elementId);
        const text = element.innerText || element.textContent;
        
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showNotification('Content copied to clipboard!', 'success');
        } catch (err) {
            showNotification('Failed to copy content.', 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

// --- Test Functions ---
function loadTestVideo() {
    // Load a test video that's known to have captions
    // Using a TED talk which typically has good captions
    document.getElementById('youtubeUrl').value = 'https://www.youtube.com/watch?v=A_QuEvzg7kU'; // TED talk with captions
    showNotification('Test video loaded! Click "Extract Subtitles" to test the functionality.', 'info');
}