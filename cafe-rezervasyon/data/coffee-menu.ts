export type CoffeeMenuItem = {
  category: string;
  items: string[];
};

export const coffeeMenu: CoffeeMenuItem[] = [
  {
    category: "Espresso Cesitleri",
    items: [
      "Espresso",
      "Double Espresso",
      "Ristretto",
      "Americano",
      "Cappuccino",
      "Flat White",
      "Macchiato",
      "Caffe Latte",
      "Mocha",
    ],
  },
  {
    category: "Filtre Kahveler",
    items: [
      "Filtre Kahve",
      "V60",
      "Chemex",
      "French Press",
      "Aeropress",
      "Cold Brew Filtre",
    ],
  },
  {
    category: "Turk Kahveleri",
    items: [
      "Turk Kahvesi Sade",
      "Turk Kahvesi Orta",
      "Turk Kahvesi Sekerli",
      "Dibek Kahvesi",
      "Menengic Kahvesi",
      "Osmanli Kahvesi",
    ],
  },
  {
    category: "Soguk Kahveler",
    items: [
      "Iced Americano",
      "Iced Latte",
      "Iced Mocha",
      "Iced Caramel Latte",
      "Frappuccino",
      "Cold Brew",
    ],
  },
  {
    category: "Aromali Kahveler",
    items: [
      "Vanilyali Latte",
      "Karamelli Latte",
      "Findikli Latte",
      "Cikolatali Mocha",
      "Tarcinli Cappuccino",
      "Hindistan Cevizli Latte",
    ],
  },
];

export const flatCoffeeMenu = coffeeMenu.flatMap((group) => group.items);
