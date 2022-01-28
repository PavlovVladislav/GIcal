const icalendar = require('node-ical')
const moment = require('moment-timezone');
const {calendar_v3} = require('googleapis')

let all_events = []
let response = {
    'statusCode': 200,
    'data': {}
}


exports.lambdaHandler = async (event) => {
    try {
        const data = icalendar.async.parseICS(event.body)

        await add_events(data, all_events)

        response.data = await add_event_to_gcal(all_events)

    } catch (err) {
        console.log(err);
        return err;
    }

    return response

};

async function add_events(data, all_events){
    for (let k in data) {
        if (data.hasOwnProperty(k)) {
            let ev = data[k];
            if (data[k].type == 'VEVENT') {
                await add_one_event(ev, all_events)
            }
        }
    }
}

async function add_one_event(ev, all_events){
    all_events.push({
        'summary': ev.summary,
        'location': ev.location,
        'description': ev.description,
        'start': {
            'dateTime': moment(new Date(ev.start)).format(),
            'timeZone': ev.timeZone,
        },
        'end': {
            'dateTime': moment(new Date(ev.end)).format(),
            'timeZone': ev.timeZone,
        }
    })
}

async function add_event_to_gcal(all_events){
    let errors = []
    let successes = []
    for(let event of all_events){
        calendar_v3.events.insert({
            calendarId: 'primary',
            resource: event,
        }, function(err, event) {
            if (err) {
                errors.push('There was an error contacting the Calendar service: ' + err)
                return;
            }
            successes.push('Event created: %s', event.htmlLink)
        });
    }
    return {
        'errors': errors,
        'successes': successes
    }
}