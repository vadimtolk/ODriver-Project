'use strict';

const TelegramBot = require('node-telegram-bot-api');
const { callbackQuery } = require('telegraf/filters');
const { inlineKeyboard, button } = require('telegraf/markup');
const TOKEN = 'your token';
const bot = new TelegramBot(TOKEN, { polling: {interval: 1000, autoStart: true}});

const CEO_ID = 2110633873;
const CHANNEL_ID = -1002339136855;
const BAN_LIST = {};

bot.on('polling_error', err => console.log('error'));

let go = 1000, rev = 0;

function keyBoard() {
    return {   
        reply_markup: {
            inline_keyboard: [

            [
                { text: 'Добавить путь ♾️', callback_data: 'button3' }
            ],

            [
                { text: 'Добавить дату & время ⏱️', callback_data: 'button4' }
            ],

            [
                { text: 'Добавить цену 💸', callback_data: 'button5' }
            ],

            [
                { text: 'Добавить дополнительные сведения ✍️', callback_data: 'button6' }
            ],

            [
                { text: 'Подтвердить маршрут ✅', callback_data: 'button7' }
            ],

            [
                {text: 'Отмена ⏬', callback_data: 'cancelBtn'}
            ]
          ]
        }
    };
}

function getTripTag() {
    return go += 1;
}

function getReviewTag() {
    return rev += 1;
}

class User {
    static users = {};

    constructor(id, username = null, nickname = 'guest', date, number = null) {
        this._username = username;
        this._nickname = nickname;
        this._id = id;
        this.date = date;
        this.number = number;

        this.review = {length: 0};
        this.tripList = {};

        this.statictic = {
            premium: 'без подписки ➖',
            trips: 0,
            description: 'пока ничего нет ✍️',
        };
    }

    getUserInfo() {
        return `🪪 Пользователь : ${this._nickname} (${this._username}) : \n\n🕰 Дата создания : ${this.date} \n\n▶️ Подписка OgarevPremium : ${this.statictic.premium} \n▶️ Количество поездок : ${this.statictic.trips} 📌\n▶️ Описание : ${this.statictic.description}`;
    }

    getUserReviews() {
        let msg = '';

        for (let [key, value] of Object.entries(this.review)) {
            if (key === 'length') continue;
            msg += value + '\n\n';
        }

        return (msg === '') ? 0 : msg;
    }

    getUserTrips() {
        let msg = '';

        for (let [key, value] of Object.entries(this.tripList)) {
            msg += `${key} : ${value} \n\n`;
        }

        return (msg === '') ? 0 : msg;
    }
}

class Trip {
    static trips = {};

    constructor(userId, nickname, trip = 'не указано', time = 'не указано', tag, price = 'не указано', description = 'не указано', isDriver = false) {
        this.userId = userId;
        this.nickname = nickname;
        this.price = price;
        this.isDriver = isDriver;
        this.trip = trip;
        this.time = time;
        this.tag = tag;
        this.description = description;
        this.canBePlace = 'На проверке... 🔜';
    }

    getAncetInfo() {
        return `🚗 Маршрут <code>#${this.tag}</code> : \n\n▶️ Путь : ${this.trip} 📚\n▶️ Время : ${this.time} 🗓\n▶️ Цена : ${this.price} 💸\n▶️ Примечания : ${this.description} 📒\n▶️ Статус : ${this.canBePlace} \n\n▶️ ${this.isDriver} : <b>${this.nickname}</b> 🪪`;
    }
}

console.log('started');

const commands = [
    {command: 'start', description: 'Перезапустить бота'},
    {command: 'create_trip', description: 'Создать маршрут'},
    {command: 'my_trips', description: 'Мои маршруты'},
    {command: 'my_profile', description: 'Профиль'},
    {command: 'set_description', description: 'Изменить описание'},
    {command: 'donate', description: 'Поддержать проект'},
    {command: 'info', description: 'О проекте'}
];

bot.setMyCommands(commands);

bot.on('text', async (ctx) => {
    const id = ctx.from.id;

    const options = {
        reply_markup: {
          inline_keyboard: [
            [
                { text: 'Да ❇️', callback_data: 'button1' }
            ],

            [
                { text: 'Нет ❌', callback_data: 'button2' }
            ]
          ]
        }
      };

    if (ctx.text === '/start' && !User.users[id]) await bot.sendMessage(id, '👋 Рады приветствовать Вас на нашей платформе по поиску попутчика! \n\n✅ Для продолжения вам следует пройти быструю регистрацию. Нам потребуется ваш номер телефона и  юзернейм \n\n 🔖 Не забудьте подписаться на канал @ODriver13 чтобы не пропустить маршруты\n\n🤝 P.S Вам обязательно потребуется установить юзернейм, так без него связаться с вами будет невозможным для пользователя. \n\n📌Вы согласны?', {reply_markup: options.reply_markup});
    if (ctx.text === '/start' && User.users[id]) await bot.sendMessage(id, `Здравствуйте, ${User.users[id]._nickname}. Хорошего дня и удачных поездок!`);
});

bot.on('text', async (ctx) => {

    if (ctx.text === '/my_profile' && User.users[ctx.from.id]) {
        const keyb2 = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'Мои маршруты 📚', callback_data: 'button12'}
                    ], 

                    [
                        {text: `Мои отзывы 📊 (${User.users[ctx.from.id].review.length})`, callback_data: 'button20'}
                    ]
                ]
            }
        }

        await bot.sendMessage(ctx.from.id, User.users[ctx.from.id].getUserInfo(), {reply_markup: keyb2.reply_markup});
    } 

    if (ctx.text === '/my_profile' && !User.users[ctx.from.id]) {
        await bot.sendMessage(ctx.from.id, 'Чтобы посмотреть ваш профиль необходимо пройти регистрацию ✅ /start');
    }
});

const ban = /\!ban.+/
bot.on('text', async (ctx) => {
    if (ban.test(ctx.text) && ctx.from.id === CEO_ID) {
        const banned = ctx.text.slice(4, 16)
        BAN_LIST[banned] = 'banned.';

        await bot.sendMessage(CEO_ID, `Пользователь ${banned} заблокирован.`);
    } 
});

bot.on('text', async (ctx) => {
    if (BAN_LIST[ctx.from.id]) { 
        await bot.sendMessage(ctx.from.id, `Вы были навсегда заблокированы за нарушение пользовательского соглашения.`);
        return;
    }
});

bot.on('text', async (ctx) => {
    if (ctx.text === '/donate') {
        await bot.sendMessage(ctx.from.id, 'потом можно подключить эквайринг или донат в виде звезд');
    }
});

bot.on('text', async (ctx) => {
    if (ctx.text === '/info') {
        const keyb1 = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'Читать 📖', url: `https://telegra.ph/Bot-pomoshchnik-dlya-poiska-poputchika-11-19`}
                    ]
                ]
            }
        };

        await bot.sendMessage(ctx.from.id, 'Ниже представлена Telegraf - статья ⏬', {reply_markup: keyb1.reply_markup});
    }
});

try {
    bot.on('callback_query', async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const action = callbackQuery.data;
    
        const options = {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: "Поделиться контактом ✅",
                            request_contact: true
                        }
                    ]
                ],
                resize_keyboard: true
            }
        };
    
        if (action === 'button1') {
            let username;
    
            if (callbackQuery.from.username) username = '@' + callbackQuery.from.username;
            else username = 'без юзера';
        
            let name = callbackQuery.from.first_name;
            let id = callbackQuery.from.id;
    
            let date = new Date();
            let year = String(date.getFullYear()).padStart(2, '0');
            let month = String(date.getMonth() + 1).padStart(2, '0');
            let day = String(date.getDate()).padStart(2, '0');
    
            let targetDate = `${day}.${month}.${year}`;
    
            User.users[id] = new User(id, username, name, targetDate);
            (User.users[id]._id === CEO_ID) ? User.users[id].statictic.premium = 'CEO 🔰' : User.users[id].statictic.premium;
    
            await bot.sendMessage(chatId, `🌟 Отлично. Вы почти зарегистрированы. Теперь отправьте свой контакт в чат с помощью функции "поделиться контактом"`, {reply_markup: options.reply_markup});
            return;
    
        }
    
        if (action === 'button2') {
            await bot.sendMessage(chatId, `Регистрация отменена ➖`);
            return;
        }
    });
} catch (err) {
    console.warn(err);
}

try {
    bot.on('message', async (msg) => {
        const chatId = msg.from.id;
    
        if (msg.contact && msg.from.username) {
            const phoneNumber = msg.contact.phone_number;
            User.users[chatId].number = phoneNumber;
            console.log(`Пользователь поделился номером телефона: ${phoneNumber} | ID : ${User.users[chatId]._id}`);
            await bot.sendMessage(chatId, `🤝 Отлично! Верификация пройдена. \n\n ${User.users[chatId].getUserInfo()}`, { reply_markup: {remove_keyboard: true} });
            return;
        }
        
        if (msg.contact && !msg.from.username) {
            await bot.sendMessage(chatId, 'У вас должен быть юзернейм для чтобы с вами можно было связаться.');
        }
    });
} catch (err) {
    console.warn(err)
}

const waiter = {};

try {
    bot.on('text', async (ctx) => {
        const id = ctx.from.id;
    
        if (ctx.text === '/set_description') {
    
            //console.log(id);
    
            if (User.users[id]) {
                await bot.sendMessage(id, 'Хорошо, пришлите описание своего профиля. ✍️');
                waiter[id] = true;
                //console.log(waiter.valueOf());
                return;
            }
    
            await bot.sendMessage(id, '✍️ Прежде чем менять описание, пройдите регистрацию /start');
        }
    
        else if (waiter[id]) {
            User.users[id].statictic.description = ctx.text;
            await bot.sendMessage(id, `✅ Ваше описание успешно сохранено! \n\n ${User.users[id].getUserInfo()}`);
            delete waiter[id];
        }
    });
} catch (err) {
    console.warn(err)
}

let tag;
let step = false;
let currentId = null;

bot.on('text', async (ctx) => {
    if (ctx.text === '/create_trip' && !User.users[ctx.from.id]) {
        await bot.sendMessage(ctx.from.id, 'Чтобы добавлять маршруты необходимо пройти регистрацию /start');
        return;
    }

    if (ctx.text === '/create_trip' && !User.users[ctx.from.id].number) {
        await bot.sendMessage(ctx.from.id, 'Пожалуйста, пройдите обязательную верификацию. Нажмите кнопку "Поделиться контактом ✅" рядом с клавиатурой.');
        return;
    }

    if (ctx.text === '/create_trip' && User.users[ctx.from.id]) {
        // console.log('current  ' + currentId);
        if (step === true) {
            const chatId = ctx.from.id;
            if (currentId === chatId) return;

            await bot.sendMessage(chatId, 'В данный момент кто-то создает маршрут. Пожалуйста, подождите пару минут ❤️');
            return;
        }

        currentId = ctx.from.id;
        step = true;
        const options = {
            reply_markup: {
              inline_keyboard: [
                [
                    { text: 'Я водитель', callback_data: 'button8' }, { text: 'Я пассажир', callback_data: 'button9' }
                ],
                [
                    {text: 'Отмена ⏬', callback_data: 'cancelBtn'}
                ]
              ]
            }
          };

    tag = getTripTag();

    Trip.trips[tag] = new Trip(ctx.from.id, ctx.from.first_name, 'не указано', 'не указано', tag, 'не указано', 'не указано');

    await bot.sendMessage(ctx.from.id, 'Хорошо, давайте вместе создадим вашу анкету. Но сначала укажите кем вы будете являться для данного маршрута', {reply_markup: options.reply_markup});
    }
});

const mess = {};
const waiter1 = {};

try {
    bot.on('callback_query', async (callbackQuery) => {
        const action = callbackQuery.data;
        const chatId = callbackQuery.from.id; 
        const msgId = callbackQuery.message.message_id; 
        mess[chatId] = msgId;
    
        waiter1[chatId] = {};
    
        //console.log(currentId);
        
        // console.log(mess[chatId]);
        // console.log(chatId);
        if (action === 'cancelBtn') {
            currentId = null;
            step = false;

            await bot.editMessageText('Вы отменили создание маршрута ❌', {
                chat_id: chatId,
                message_id: mess[chatId],
            });
        }
        
        if (action === 'button3') {
            await bot.sendMessage(chatId, 'Отправьте ваш маршрут (где он начнется и где он закончится), например : Кольцевая - Университет или Веселовского 40 - Полежаева 34');
            waiter1[chatId].b3 = true;
        }
    
        if (action === 'button4') {
            await bot.sendMessage(chatId, 'Отправьте дату (время), в которое вы будете проезжать мимо указанного начала пути (если вы водитель) или в которое вы будете находиться на маршруте');
            waiter1[chatId].b4 = true;
        }
    
        if (action === 'button5') {
            await bot.sendMessage(chatId, 'Отправьте сумму, которую вы готовы заплатить (если вы пассажир) или за которую вы готовы подвезти (если вы водитель)');
            waiter1[chatId].b5 = true;
        }
    
        if (action === 'button6') {
            await bot.sendMessage(chatId, 'Вы можете добавить сюда разные примечания и тому подобное (не обязательно к заполнению).');
            waiter1[chatId].b6 = true;
        }
    
        if (action === 'button8') {
            Trip.trips[tag].isDriver = 'Водитель';
            const options = keyBoard();
            await bot.editMessageText(`Теперь нужно заполнить необходимые данные. После того, как все заполните нажмите "Подтвердить маршрут"`, {chat_id: chatId, message_id: mess[chatId], reply_markup: options.reply_markup});
        }
    
        if (action === 'button9') {
            Trip.trips[tag].isDriver = 'Пассажир';
            const options = keyBoard();
        
            await bot.editMessageText(
                `Теперь нужно заполнить необходимые данные. После того, как все заполните нажмите "Подтвердить маршрут"`,
                {
                    chat_id: chatId,
                    message_id: mess[chatId],
                    reply_markup: options.reply_markup 
                });
            }
    
        if (action === 'button7') {
                const keyb1 = {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {text: 'Да', callback_data: 'button10'}
                                ],
    
                                [
                                    {text: 'Нет', callback_data: 'button11'}
                                ]
                            ]
                        }
                    };
    
                await bot.sendMessage(CEO_ID,`Пользователь ${chatId} хочет разместить маршрут : \n\n ${Trip.trips[tag]?.getAncetInfo()}`, {reply_markup: keyb1.reply_markup, parse_mode: 'HTML'});
                await bot.sendMessage(chatId, `Отлично. Форма заполнена. Сейчас она пройдет быструю проверку со стороны модерации и будет размещена на канале. \n\n ${Trip.trips[tag]?.getAncetInfo()}`, {parse_mode: 'HTML'});
                
                let whatAdd = Trip.trips[tag].getAncetInfo();
                User.users[callbackQuery.from.id].tripList[tag] = whatAdd;
                // console.log(whatAdd);
                // console.log(User.users[chatId].tripList[tag]);
        }
    });
} catch (err) {
    console.log(err);
}

bot.on('text', async (ctx) => {
    const chatId = ctx.from.id;

    const options = keyBoard();

    if (waiter1?.[chatId]?.b3) {
        Trip.trips[tag].trip = ctx.text;
        await bot.sendMessage(ctx.from.id, `Вы добавили путь ${Trip.trips[tag].trip}. Двигаемся дальше.`, {reply_markup: options.reply_markup});
        delete waiter1[chatId].b3;
    }
});

try {
    bot.on('text', async (ctx) => {
        const options = keyBoard();
    
        if (waiter1?.[ctx.from.id]?.b4) {
            Trip.trips[tag].time = ctx.text;
            await bot.sendMessage(ctx.from.id, `Вы добавили время ${Trip.trips[tag].time}. Двигаемся дальше.`, {reply_markup: options.reply_markup});
            delete waiter1[ctx.from.id].b4;
        }
    });
    
    bot.on('text', async (ctx) => {
        const options = keyBoard();
    
        if (waiter1?.[ctx.from.id]?.b5) {
            Trip.trips[tag].price = ctx.text;
            await bot.sendMessage(ctx.from.id, `Вы добавили цену ${Trip.trips[tag].price}. Двигаемся дальше.`, {reply_markup: options.reply_markup});
            delete waiter1[ctx.from.id].b5;
        }
    });
    
    bot.on('text', async (ctx) => {
        const options = keyBoard();
    
        if (waiter1?.[ctx.from.id]?.b6) {
            Trip.trips[tag].description = ctx.text;
            await bot.sendMessage(ctx.from.id, `Вы добавили доп. сведения ${Trip.trips[tag].description}. Двигаемся дальше.`, {reply_markup: options.reply_markup});
            delete waiter1[ctx.from.id].b6;
        }
    });
    
    bot.on('text', async (ctx) => {
        if (ctx.text === '/my_trips') {
            if (User.users[ctx.from.id]?.tripList[tag]) {
                await bot.sendMessage(ctx.from.id, `${User.users[id].getUserTrips()} \n\n`, {parse_mode: 'HTML'});
            } else {
                await bot.sendMessage(ctx.from.id, 'У вас пока нет маршрутов. Добавить? /create_trip');
            }
        }
    });
} catch (err) {
    console.warn(err);
}

bot.on('callback_query', async (callbackQuery) => {
    const data = callbackQuery.data;
    const msgId3 = callbackQuery.message.message_id;

    const keyb1 = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Перейти в профиль ↩️', callback_data: `buttonX`}
                        ]
                    ]
                }
            };

    const keyb2 = {
        reply_markup: {
            inline_keyboard: [
                [
                    {text: 'Мои маршруты 📚', callback_data: 'button12'}
                ]
            ]
        }
    }

    if (data === 'button10') {
        Trip.trips[tag].canBePlace = 'Разрешен ✅';
        User.users[currentId].tripList[tag] = Trip.trips[tag].getAncetInfo();
        await bot.sendMessage(CHANNEL_ID, Trip.trips[tag].getAncetInfo(), {parse_mode: 'HTML', reply_markup: keyb1.reply_markup});
        await bot.sendMessage(currentId, 'Ваш маршрут успешно размещен! ✅', {reply_markup: keyb2.reply_markup});
        await bot.editMessageText(`${Trip.trips[tag].getAncetInfo()} \n\n Разрешен.`, {chat_id: CEO_ID, message_id: msgId3, parse_mode: 'HTML'});
        currentId = null;
        step = false;
    }

    if (data === 'button11') {
        Trip.trips[tag].canBePlace = 'Отклонен ❌';
        User.users[currentId].tripList[tag] = Trip.trips[tag].getAncetInfo();
        await bot.sendMessage(currentId, 'К сожалению, мы вынуждены отказать Вам в публикации маршрута из-за соображений безопасности ❌');
        await bot.editMessageText(`${Trip.trips[tag].getAncetInfo()} \n\n Отказано.`, {chat_id: CEO_ID, message_id: msgId3, parse_mode: 'HTML'});
        currentId = null;
        step = false;
    }
});

let profile = {};

function getId(objectWithTagAndId, searchTag) {
    for (let user in objectWithTagAndId) {
        const currentUser = objectWithTagAndId[user];
        
        for (let tag in currentUser.tripList) {
            if (tag === searchTag) return currentUser._id;
        }
    }

    return null;
}

bot.on('callback_query', async (callbackQuery) => {
    const data = callbackQuery.data;
    const id = callbackQuery.from.id;
    const msgText = callbackQuery.message.text;

    if (data === 'button12' && User.users[id]?.getUserTrips()) {
        await bot.sendMessage(id, `${User.users[id].getUserTrips()} \n\n`, {parse_mode: 'HTML'});
    }

    if (data === 'button12' && !User.users[id]?.getUserTrips()) {
        await bot.sendMessage(id, `У вас пока нет маршрутов. Добавить? /create_trip`);
    }

    if (data === 'buttonX') {
        const tripTag = msgText.slice(12, 16);
        profile[id] = getId(User.users, tripTag);
        //console.log(profile[id] ? profile[id] : `${callbackQuery.from.id} не зарегистрирован`);

        if (!User.users?.[callbackQuery.from.id]) {
            await bot.answerCallbackQuery(callbackQuery.id, {text: 'Чтобы взаимодействовать с пользователями вам необходимо зарегистрироваться. Отправили вам личное сообщение!', show_alert: true});
            await bot.sendMessage(callbackQuery.from.id, `Зарегистрируйтесь прямо сейчас ➡️ /start`);
            return;
        }

        if (User.users[profile[id]]._id === callbackQuery.from.id) {
            await bot.answerCallbackQuery(callbackQuery.id, {text: 'Это вы! :)', show_alert: true});
            return;
        }

        const key = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'Связаться 🔗', url: `https://t.me/${User.users[profile[id]]._username.slice(1)}`}
                    ],

                    [
                        {text: `📊 Отзывы (${User.users[profile[id]].review.length})`, callback_data: 'buttonR'}
                    ]
                ]
            }
        };

        await bot.answerCallbackQuery(callbackQuery.id, {text: 'Профиль пользователя отправлен вам в личные сообщения.', show_alert: true});
        await bot.sendMessage(callbackQuery.from.id, User.users[profile[id]].getUserInfo(), {reply_markup: key.reply_markup});
    }
    
    if (data === 'buttonR') {
        const userReviews = User.users[profile[id]]?.getUserReviews();

        if (userReviews) {
            await bot.sendMessage(callbackQuery.from.id, `📌 Отзывы пользователя : \n\n ${userReviews} \n\n`);
            return;
        } else {
            await bot.sendMessage(callbackQuery.from.id, 'У пользователя пока нет отзывов 📂');
            return;
        }
    }
});

bot.on('callback_query', async (callbackQuery) => {
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id; 
    
    if (data === 'button20') {
        const userReviews = User.users[userId]?.getUserReviews();

        if (userReviews) {
            await bot.sendMessage(userId, `📌 Ваши отзывы : \n\n ${userReviews} \n\n`);
            return;
        } else {
            await bot.sendMessage(userId, 'У вас пока нет отзывов. Создайте маршрут и начните взаимодействовать с пользователями! /create_trip');
            return;
        }
    }
});

bot.on('text', async (ctx) => {
    if (ctx.text === '/admin1' && ctx.from.id === CEO_ID) {
        await bot.sendMessage(CEO_ID, JSON.stringify(User.users, null, 2));
    }

    if (ctx.text === '/admin2' && ctx.from.id === CEO_ID) {
        await bot.sendMessage(CEO_ID, JSON.stringify(Trip.trips, null, 2));
    }
});

const tripAdd = /add_trip.+\_.+/;
const revAdd = /add_rev.+\_.+\_.+/;

bot.on('text', async (ctx) => {
    if (tripAdd.test(ctx.text)) {

    const addId = +ctx.text.slice(8, 18);
    const addTrips = +ctx.text.slice(19);

    if (!User.users[addId] || isNaN(addTrips)) {
        await bot.sendMessage(CEO_ID, `Такого пользователя нет или вы ошиблись числом.`);
        return;
    }

    if (User.users[addId] && isFinite(addTrips)) {
        User.users[addId].statictic.trips += addTrips;
        await bot.sendMessage(CEO_ID, `Вы добавили пользователю ${addId} : \n\n ${addTrips} поездку(-ок).`);
    }
}
});

bot.on('text', async (ctx) => {
    if (revAdd.test(ctx.text)) {

    let addId = +ctx.text.slice(7, 17);
    let addRev = ctx.text.slice(21);
    let rate = ctx.text.slice(18, 20);

    if (!User.users[addId]) {
        await bot.sendMessage(CEO_ID, `Такого пользователя нет.`);
        return;
    }

    let tag = getReviewTag();

    User.users[addId].review[tag] = `${rate} : ${addRev}`;
    User.users[addId].review.length += 1;

    if (User.users[addId]) {
        const keyb2 = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: `Мои отзывы 📊 (${User.users[addId].review.length})`, callback_data: 'button20'}
                    ]
                ]
            }
        }

        await bot.sendMessage(CEO_ID, `Вы добавили пользователю ${addId} : \n\n Отзыв: \n ${rate} : ${addRev}.`);
        await bot.sendMessage(addId, 'У вас появился новый отзыв! 📬', {reply_markup: keyb2.reply_markup});
    }
}
});