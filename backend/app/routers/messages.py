from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from .. import models, schemas, services
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/conversations", tags=["messages"])


def _mine(db: Session, convo_id: int, user: models.User) -> models.Conversation:
    """The conversation, only if the user is its guest or its host (404 otherwise, so ids don't leak)."""
    convo = db.get(models.Conversation, convo_id)
    if not convo or user.id not in (convo.guest_id, convo.host_id):
        raise HTTPException(404, "Conversation not found")
    return convo


@router.get("", response_model=list[schemas.ConversationOut])
def my_conversations(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = db.scalars(
        select(models.Conversation).where((models.Conversation.guest_id == user.id) | (models.Conversation.host_id == user.id))
    ).all()
    out = [services.conversation_out(db, c, user) for c in rows if c.messages]
    out.sort(key=lambda c: (c.last_message.created_at, c.last_message.id), reverse=True)
    return out


@router.get("/unread")
def unread_total(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = db.scalars(
        select(models.Conversation).where((models.Conversation.guest_id == user.id) | (models.Conversation.host_id == user.id))
    ).all()
    return {"count": sum(services.unread_in(db, c, user) for c in rows)}


@router.post("", response_model=schemas.ConversationDetail, status_code=201)
def start_conversation(
    body: schemas.ConversationStart, db: Session = Depends(get_db), user: models.User = Depends(get_current_user),
):
    """"Message host": opens (or reuses) your thread about a listing and sends the first message."""
    listing = db.get(models.Listing, body.listing_id)
    if not listing or not listing.is_active:
        raise HTTPException(404, "Listing not found")
    if listing.host_id == user.id:
        raise HTTPException(400, "You can't message yourself")
    convo = services.get_or_create_conversation(db, listing, user)
    services.post_message(db, convo, user, body.body)
    db.commit()
    db.refresh(convo)
    return services.conversation_out(db, convo, user, with_messages=True)


@router.get("/{convo_id}", response_model=schemas.ConversationDetail)
def read_conversation(convo_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    convo = _mine(db, convo_id, user)
    out = services.conversation_out(db, convo, user, with_messages=True)  # computed before marking read
    services.mark_read(convo, user)
    db.commit()
    out.unread = 0
    return out


@router.post("/{convo_id}/messages", response_model=schemas.MessageOut, status_code=201)
def send_message(
    convo_id: int, body: schemas.MessageIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user),
):
    convo = _mine(db, convo_id, user)
    msg = services.post_message(db, convo, user, body.body)
    db.commit()
    db.refresh(msg)
    return msg
