export function arrayMove(array, from, to) {
  const newArray = array.slice();
  newArray.splice(
    to < 0 ? newArray.length + to : to,
    0,
    newArray.splice(from, 1)[0],
  );
  return newArray;
}

export function formatEditDate(dateTimeStamp) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const weekdays = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];
  const convertToDate = new Date(dateTimeStamp);

  const [weekday, month, day] = [
    weekdays[convertToDate.getDay()],
    months[convertToDate.getMonth()],
    convertToDate.getDate(),
  ];

  return `Edited ${weekday}, ${month} ${day}.`;
}
