var config = {
  apiKey: 'AIzaSyCrgy5YdO8wPdSgCeeBN-RMcY5qVoutLm8',
  authDomain: 'dookie-1a65d.firebaseapp.com',
  databaseURL: 'https://dookie-1a65d.firebaseio.com',
  projectId: 'dookie-1a65d',
  storageBucket: 'dookie-1a65d.appspot.com',
  messagingSenderId: '790651845353'
}
firebase.initializeApp(config)

emojify.setConfig({
  ignore_emoticons: true,
  mode: 'data-uri'
})

const loggedOutContent = document.getElementById('logged-out')
const loggedInContent = document.getElementById('logged-in')
const language = window.navigator.userLanguage || window.navigator.language
const params = (new URL(document.location)).searchParams
const ref = firebase.database().ref()

function init() {
  if (docCookies.hasItem('petId')) {
    let petId = docCookies.getItem('petId')
    showContent()
    fetchData()
  } else {
    let petId = params.get('petId')
    petId ? checkValidPetId(petId) : showLogin()
  }
}

function login() {
  var value = document.getElementById('inputPetId').value
  var res = encodeURIComponent(value)
  checkValidPetId(value)
}

function logout() {
  docCookies.removeItem('petId')
  clearActivities()
  showLogin()
}

function checkValidPetId(id) {
  if (id !== '') {
    ref.child('pets').child(id).once('value').then(snapshot => {
      var data = snapshot.val()
      if (data) {
        docCookies.setItem('petId', id)
        window.history.replaceState({}, 'Dookie', '/app/');
        showContent()
        fetchData()
      } else {
        alert('The pet ID you entered doesn’t match any existing pet. Please check that you’ve entered the pet ID correctly.')
        logout()
      }
    })
  }
}

function fetchData() {
  var petId = docCookies.getItem('petId')
  var activityRef = ref.child('activities')
  var petRef = ref.child('pets/' + petId)

  activityRef.orderByChild('pid').equalTo(petId).limitToLast(20).once('value').then(snapshot => {
    if (snapshot.val()) {
      var array = []
      snapshot.forEach(child => {
        array.push(child.val())
      })
      sortActivitiesByDay(array.reverse())
    } else {
      alert('This pet doesn’t exist. Please check that you’ve entered the pet ID correctly.')
      logout()
    }
  })

  petRef.once('value').then(snapshot => {
    var data = snapshot.val()
    var name = document.getElementById('name')
    var icon = document.getElementById('icon')
    name.innerText = data.name
    icon.className = (data.emoji !== '') ? 'mr2' : ''
    icon.innerHTML = emojify.replace(data.emoji)
  })
}

function sortActivitiesByDay(array) {
  var sortedArray = array.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  var todayArray = sortedArray.filter(child => {
    var today = new Date()
    var childDate = new Date(child.date)
    return childDate.setHours(0,0,0,0) === today.setHours(0,0,0,0)
  })
  var yesterdayArray = sortedArray.filter(child => {
    var yesterday = new Date(Date.now() - 86400000)
    var childDate = new Date(child.date)
    return childDate.setHours(0,0,0,0) === yesterday.setHours(0,0,0,0)
  })
  todayArray.length === 0 ? showEmptyMessage('today') : hideLoadingMessage('today')
  todayArray.forEach(child => {
    addActivityElement(child.date, child.type, 'today')
  })
  yesterdayArray.length === 0 ? showEmptyMessage('yesterday') : hideLoadingMessage('yesterday')
  yesterdayArray.forEach(child => {
    addActivityElement(child.date, child.type, 'yesterday')
  })
}

function addActivityElement(date, type, id) {
  var container = document.getElementById(id + '-list')
  var activity = document.createElement('div')
  var date = new Date(date)
  var options = { hour12: false, hour: 'numeric', minute: 'numeric' }
  var timeString = date.toLocaleTimeString(language, options)
  var emoji = emojify.replace(type.toString().replace(/\,/g,''))
  activity.className = 'pv3 flex items-center'
  activity.innerHTML = '<div class="time w3"></div><div class="emojis"></div>'
  activity.getElementsByClassName('time')[0].innerText = timeString
  activity.getElementsByClassName('emojis')[0].innerHTML = emoji
  container.appendChild(activity)
}

function clearActivities() {
  document.getElementById('today-list').innerHTML = ''
  document.getElementById('yesterday-list').innerHTML = ''
}

function showLogin() {
  loggedOutContent.className = 'db'
  loggedInContent.className = 'dn'
}

function showContent() {
  loggedOutContent.className = 'dn'
  loggedInContent.className = 'db'
}

function hideLoadingMessage(id) {
  var container = document.getElementById(id)
  container.getElementsByClassName('spinner-container')[0].classList.add('dn')
}

function showEmptyMessage(id) {
  var container = document.getElementById(id)
  container.getElementsByClassName('spinner-container')[0].classList.remove('dn')
  container.getElementsByClassName('spinner-image')[0].classList.add('dn')
  container.getElementsByClassName('spinner-text')[0].innerText = 'No activities'
}

init()