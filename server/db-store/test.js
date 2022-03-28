function time_converter(UNIX_timestamp){
    let t = new Date(UNIX_timestamp);
    return `${t.getDate()}-${t.getMonth()+1}-${t.getFullYear()} ${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}.${t.getMilliseconds()}`;
}

console.log(time_converter(parseInt('1647907269678')));

