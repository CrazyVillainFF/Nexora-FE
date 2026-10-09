export const sortContactsByRecentConversations = (contacts, conversations) => {
  const recentPositions = new Map();
  conversations.forEach((conversation, index) => {
    const peerId = conversation.peer?._id;
    if (peerId != null && !recentPositions.has(String(peerId))) {
      recentPositions.set(String(peerId), index);
    }
  });

  return contacts
    .map((contact, originalPosition) => ({ contact, originalPosition }))
    .sort((left, right) => {
      const leftPosition = recentPositions.get(String(left.contact._id)) ?? Number.MAX_SAFE_INTEGER;
      const rightPosition = recentPositions.get(String(right.contact._id)) ?? Number.MAX_SAFE_INTEGER;
      return leftPosition - rightPosition || left.originalPosition - right.originalPosition;
    })
    .map(({ contact }) => contact);
};
