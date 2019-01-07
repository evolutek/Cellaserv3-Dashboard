export class Client {
  id: string;
  name: string;
}

export class Service {
  client: string;
  name: string;
  identification: string;
}

export class Publish<T> {
  name: string;
  data: T;
}

export class Subscribers {
  event: string;
  subscribers: string[];
}

export class NewSubscriber {
  event: string;
  client: string;
}
