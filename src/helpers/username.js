const fruits = [
  'apple',
  'banana',
  'orange',
  'grape',
  'kiwi',
  'mango',
  'pineapple',
  'strawberry',
  'blueberry',
  'raspberry',
  'blackberry',
  'peach',
  'plum',
  'apricot',
  'cherry',
  'lemon',
  'lime',
  'grapefruit',
  'tangerine',
  'pomegranate',
  'pear',
  'avocado',
  'coconut',
  'papaya',
  'guava',
];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function createUsername() {
  const randomIndex = getRandomInt(fruits.length - 1);
  const randomNumber = getRandomInt(999);
  return `${fruits[randomIndex]}-${randomNumber}`;
}
