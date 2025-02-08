type StanzaMetadata = {
    expanded?: boolean;
}

type StanzaData = {
  id: number,
  metadata: StanzaMetadata
}

const stanzas : StanzaData[] = [
      { id: 1, metadata: { expanded: true } },
      { id: 2, metadata: {  } },
      { id: 3, metadata: { expanded: true } },
    ];
  const b = stanzas.map<[number, StanzaMetadata]>(obj => [obj.id, obj.metadata]);
  const map = new Map<number, StanzaMetadata>(b);

  console.log(map.get(3));
 const jsonString = JSON.stringify(stanzas);
 console.log(JSON.parse(jsonString))