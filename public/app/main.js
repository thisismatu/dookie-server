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

const loginContent = document.getElementById('login')
const loggedInContent = document.getElementById('logged-in')
const language = window.navigator.userLanguage || window.navigator.language
const ref = firebase.database().ref()
const pid = readCookie('pid')

if (pid) {
  console.log('logged in')
  showContent()
  fetchData()
} else {
  console.log('not logged in')
  showLogin()
}

function login() {
  var inputValue = document.getElementById('pid').value
  checkValidPid(inputValue)
}

function logout() {
  eraseCookie('pid')
  location.reload()
}

function checkValidPid(pid) {
  if (pid !== '') {
    ref.child('pets/' + pid).once('value').then(function(snapshot) {
      var pet = snapshot.val()
      if (pet) {
        console.log('pet exists')
        createCookie('pid', pid, 365)
        location.reload()
      } else {
        console.log('pet does not exists')
        alert('The pet ID you entered doesn’t match any existing pet. Please check that you’ve entered the pet ID correctly.')
      }
    })
  }
}

function showLogin() {
  loginContent.className = 'db'
  loggedInContent.className = 'dn'
}

function showContent() {
  loginContent.className = 'dn'
  loggedInContent.className = 'db'
}

function hideLoadingMessage(id) {
  var container = document.getElementById(id)
  container.getElementsByClassName('silver')[0].className += ' dn'
}

function showEmptyMessage(id) {
  var container = document.getElementById(id)
  container.getElementsByClassName('silver')[0].innerText = 'No activities'
}

function fetchData() {
  var activityRef = ref.child('activities')
  var petRef = ref.child('pets/' + pid)

  activityRef.orderByChild('pid').equalTo(pid).limitToLast(20).once('value').then(function(snapshot) {
    var array = []
    snapshot.forEach(function(child) {
      array.push(child.val())
    })
    sortActivitiesByDay(array.reverse())
  })

  petRef.once('value').then(function(snapshot) {
    var data = snapshot.val()
    var name = document.getElementById('name')
    var icon = document.getElementById('icon')
    name.innerText = data.name
    icon.className = (data.emoji !== '') ? 'pr2' : ''
    icon.innerHTML = emojify.replace(data.emoji)
  })
}

function sortActivitiesByDay(array) {
  var todayArray = array.filter(function(child) {
    var today = new Date()
    var childDate = new Date(child.date)
    return childDate.setHours(0,0,0,0) === today.setHours(0,0,0,0)
  })
  var yesterdayArray = array.filter(function(child) {
    var yesterday = new Date(Date.now() - 86400000)
    var childDate = new Date(child.date)
    return childDate.setHours(0,0,0,0) === yesterday.setHours(0,0,0,0)
  })
  if (todayArray.length > 0) {
    hideLoadingMessage('today')
    todayArray.forEach(function(child) {
      addActivityElement(child.date, child.type, 'today')
    })
  } else {
    showEmptyMessage('today')
  }
  if (yesterdayArray.length > 0) {
    hideLoadingMessage('yesterday')
    yesterdayArray.forEach(function(child) {
      addActivityElement(child.date, child.type, 'yesterday')
    })
  } else {
    showEmptyMessage('yesterday')
  }
}

function addActivityElement(date, type, id) {
  var container = document.getElementById(id)
  var activity = document.createElement('div')
  var date = new Date(date)
  var options = { hour12: false, hour: 'numeric', minute: 'numeric' }
  var timeString = date.toLocaleTimeString(language, options)
  var emoji = emojify.replace(type.toString().replace(/\,/g,''))
  activity.className = 'pv2 flex items-center'
  activity.innerHTML = '<div class="time w3"></div><div class="emojis"></div>'
  activity.getElementsByClassName('time')[0].innerText = timeString
  activity.getElementsByClassName('emojis')[0].innerHTML = emoji
  container.appendChild(activity)
}

function createCookie(name,value,days) {
  var expires = '';
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + value + expires + '; path=/';
}

function readCookie(name) {
  var nameEQ = name + '=';
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

function eraseCookie(name) {
  createCookie(name,'',-1);
}
