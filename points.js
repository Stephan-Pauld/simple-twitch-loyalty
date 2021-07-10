const mariadb = require('mariadb');
const pool = mariadb.createPool({
     host: 'localhost',
     user:'admin',
     password: 'admin',
     database: "users",
     connectionLimit: 20
});
const axios = require('axios')
let allViewers = [];
let viewers = [];
let mods = [];
let vips = [];
let userInDbArr = [];
let userNotInDbArr = [];
let userInDb='UPDATE users SET toonies = CASE';
let userNotInDb='INSERT INTO users (username, toonies, tickets) VALUES '
let count = 0

const getAllViewers = async() => {
  const res = await axios.get('http://tmi.twitch.tv/group/user/abootgaming/chatters')
    viewers = res.data.chatters.viewers
    mods = res.data.chatters.moderators
    vips = res.data.chatters.vips
}

setInterval(async() => {
  await getAllViewers()
  allViewers = [];
  givePoints()
}, 10000);


const givePoints = async() => {
  allViewers.push(...viewers,...mods,...vips)
  count = 0
  for(const viewer of allViewers) {
    // addViewerPoints(viewer)
    await checkUser(viewer)
    .catch(err => {
      console.log(`ERROR IN LOOP: ${err}`);
    })
    count += 1
  }
  userInDb += ` ELSE toonies END`
  userNotInDb = userNotInDb.replace(/,\s*$/, "")

  if(userInDbArr.length){
    await giveDbUserPoints()
    userInDbArr = []
  }
  if(userNotInDbArr.length) {
    await insertIntoDb()
    userNotInDbArr = []
  }
  
userInDb='UPDATE users SET toonies = CASE';
userNotInDb='INSERT INTO users (username, toonies, tickets) VALUES '
}

const insertIntoDb = async() => {
  let conn;
  try {
    conn = await pool.getConnection();
    const enterIntoDb = await conn.query(userNotInDb)
  } catch (error) {

  } finally {
    console.log("Closing connection (insert)");
    if (conn) return conn.end();
  }
}

const giveDbUserPoints = async() => {
  let conn;
  try {
    conn = await pool.getConnection();
    const givingPoints = await conn.query(userInDb)
  } catch (error) {

  } finally {
  console.log("Closing connection (giving points)");
	if (conn) return conn.end();
  }
}

const checkUser = async(user) => {

  let conn;
try {
  conn = await pool.getConnection();
  const res = await conn.query(`
  SELECT * FROM users WHERE username = '${user}'
  `)
  if(res[0]) {
    userInDbArr.push(user)
    userInDb += ` WHEN username = '${user}' THEN toonies + 50`
  } else {
    userNotInDbArr.push(user)
    userNotInDb += `('${user}', 50, 0), `
  }

} catch (error) {

} finally {
  console.log("Closing connection (Checking Users)");
	if (conn) return conn.end();
  }
};
