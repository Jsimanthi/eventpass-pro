
package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type Querier interface {
	AnonymizeInvitee(ctx context.Context, id int32) error
	AnonymizeOrder(ctx context.Context, id int32) error
	AnonymizeUser(ctx context.Context, id pgtype.UUID) error
	CreateEvent(ctx context.Context, arg CreateEventParams) (Event, error)
	CreateInvitee(ctx context.Context, arg CreateInviteeParams) (Invitee, error)
	CreateOrder(ctx context.Context, arg CreateOrderParams) (Order, error)
	CreateReprintRequest(ctx context.Context, arg CreateReprintRequestParams) (ReprintRequest, error)
	CreateUser(ctx context.Context, arg CreateUserParams) (User, error)
	DeleteEvent(ctx context.Context, id int32) error
	GetEvent(ctx context.Context, id int32) (Event, error)
	GetExpiredInvitees(ctx context.Context) ([]Invitee, error)
	GetExpiredOrders(ctx context.Context) ([]Order, error)
	GetInvitee(ctx context.Context, id int32) (Invitee, error)
	GetInviteeBySignature(ctx context.Context, hmacSignature pgtype.Text) (Invitee, error)
	GetInviteesByEvent(ctx context.Context, eventID int32) ([]Invitee, error)
	GetUserByEmail(ctx context.Context, email string) (User, error)
	GetUserByID(ctx context.Context, id pgtype.UUID) (User, error)
	ListEvents(ctx context.Context) ([]Event, error)
	UpdateEvent(ctx context.Context, arg UpdateEventParams) (Event, error)
	UpdateInvitee(ctx context.Context, arg UpdateInviteeParams) (Invitee, error)
	UpdateInviteeState(ctx context.Context, arg UpdateInviteeStateParams) (Invitee, error)
	UpdateInviteeStateAndClaimGift(ctx context.Context, arg UpdateInviteeStateAndClaimGiftParams) (Invitee, error)
	UpdateInviteeStatus(ctx context.Context, arg UpdateInviteeStatusParams) (Invitee, error)
	UpdateOrderStatus(ctx context.Context, arg UpdateOrderStatusParams) (Order, error)
}

var _ Querier = (*Queries)(nil)
