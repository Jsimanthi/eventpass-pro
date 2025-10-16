package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

var _ Querier = (*MockQuerier)(nil)

type MockQuerier struct {
	AnonymizeInviteeFunc             func(ctx context.Context, id int32) error
	AnonymizeOrderFunc               func(ctx context.Context, id int32) error
	AnonymizeUserFunc                func(ctx context.Context, id pgtype.UUID) error
	CreateEventFunc                  func(ctx context.Context, arg CreateEventParams) (Event, error)
	CreateInviteeFunc                func(ctx context.Context, arg CreateInviteeParams) (Invitee, error)
	CreateOrderFunc                  func(ctx context.Context, arg CreateOrderParams) (Order, error)
	CreateReprintRequestFunc         func(ctx context.Context, arg CreateReprintRequestParams) (ReprintRequest, error)
	CreateUserFunc                   func(ctx context.Context, arg CreateUserParams) (User, error)
	DeleteEventFunc                  func(ctx context.Context, id int32) error
	GetEventFunc                     func(ctx context.Context, id int32) (Event, error)
	GetExpiredInviteesFunc           func(ctx context.Context) ([]Invitee, error)
	GetExpiredOrdersFunc             func(ctx context.Context) ([]Order, error)
	GetInviteeFunc                   func(ctx context.Context, id int32) (Invitee, error)
	GetInviteeBySignatureFunc        func(ctx context.Context, hmacSignature pgtype.Text) (Invitee, error)
	GetInviteesByEventFunc           func(ctx context.Context, eventID int32) ([]Invitee, error)
	GetUserByEmailFunc               func(ctx context.Context, email string) (User, error)
	GetUserByIDFunc                  func(ctx context.Context, id pgtype.UUID) (User, error)
	ListEventsFunc                   func(ctx context.Context) ([]Event, error)
	UpdateEventFunc                  func(ctx context.Context, arg UpdateEventParams) (Event, error)
	UpdateInviteeFunc                func(ctx context.Context, arg UpdateInviteeParams) (Invitee, error)
	UpdateInviteeStateFunc           func(ctx context.Context, arg UpdateInviteeStateParams) (Invitee, error)
	UpdateInviteeStateAndClaimGiftFunc func(ctx context.Context, arg UpdateInviteeStateAndClaimGiftParams) (Invitee, error)
	UpdateInviteeStatusFunc          func(ctx context.Context, arg UpdateInviteeStatusParams) (Invitee, error)
	UpdateOrderStatusFunc            func(ctx context.Context, arg UpdateOrderStatusParams) (Order, error)
}

func (m *MockQuerier) AnonymizeInvitee(ctx context.Context, id int32) error {
	return m.AnonymizeInviteeFunc(ctx, id)
}

func (m *MockQuerier) AnonymizeOrder(ctx context.Context, id int32) error {
	return m.AnonymizeOrderFunc(ctx, id)
}

func (m *MockQuerier) AnonymizeUser(ctx context.Context, id pgtype.UUID) error {
	return m.AnonymizeUserFunc(ctx, id)
}

func (m *MockQuerier) CreateEvent(ctx context.Context, arg CreateEventParams) (Event, error) {
	return m.CreateEventFunc(ctx, arg)
}

func (m *MockQuerier) CreateInvitee(ctx context.Context, arg CreateInviteeParams) (Invitee, error) {
	return m.CreateInviteeFunc(ctx, arg)
}

func (m *MockQuerier) CreateOrder(ctx context.Context, arg CreateOrderParams) (Order, error) {
	return m.CreateOrderFunc(ctx, arg)
}

func (m *MockQuerier) CreateReprintRequest(ctx context.Context, arg CreateReprintRequestParams) (ReprintRequest, error) {
	return m.CreateReprintRequestFunc(ctx, arg)
}

func (m *MockQuerier) CreateUser(ctx context.Context, arg CreateUserParams) (User, error) {
	return m.CreateUserFunc(ctx, arg)
}

func (m *MockQuerier) DeleteEvent(ctx context.Context, id int32) error {
	return m.DeleteEventFunc(ctx, id)
}

func (m *MockQuerier) GetEvent(ctx context.Context, id int32) (Event, error) {
	return m.GetEventFunc(ctx, id)
}

func (m *MockQuerier) GetExpiredInvitees(ctx context.Context) ([]Invitee, error) {
	return m.GetExpiredInviteesFunc(ctx)
}

func (m *MockQuerier) GetExpiredOrders(ctx context.Context) ([]Order, error) {
	return m.GetExpiredOrdersFunc(ctx)
}

func (m *MockQuerier) GetInvitee(ctx context.Context, id int32) (Invitee, error) {
	return m.GetInviteeFunc(ctx, id)
}

func (m *MockQuerier) GetInviteeBySignature(ctx context.Context, hmacSignature pgtype.Text) (Invitee, error) {
	return m.GetInviteeBySignatureFunc(ctx, hmacSignature)
}

func (m *MockQuerier) GetInviteesByEvent(ctx context.Context, eventID int32) ([]Invitee, error) {
	return m.GetInviteesByEventFunc(ctx, eventID)
}

func (m *MockQuerier) GetUserByEmail(ctx context.Context, email string) (User, error) {
	return m.GetUserByEmailFunc(ctx, email)
}

func (m *MockQuerier) GetUserByID(ctx context.Context, id pgtype.UUID) (User, error) {
	return m.GetUserByIDFunc(ctx, id)
}

func (m *MockQuerier) ListEvents(ctx context.Context) ([]Event, error) {
	return m.ListEventsFunc(ctx)
}

func (m *MockQuerier) UpdateEvent(ctx context.Context, arg UpdateEventParams) (Event, error) {
	return m.UpdateEventFunc(ctx, arg)
}

func (m *MockQuerier) UpdateInvitee(ctx context.Context, arg UpdateInviteeParams) (Invitee, error) {
	return m.UpdateInviteeFunc(ctx, arg)
}

func (m *MockQuerier) UpdateInviteeState(ctx context.Context, arg UpdateInviteeStateParams) (Invitee, error) {
	return m.UpdateInviteeStateFunc(ctx, arg)
}

func (m *MockQuerier) UpdateInviteeStateAndClaimGift(ctx context.Context, arg UpdateInviteeStateAndClaimGiftParams) (Invitee, error) {
	return m.UpdateInviteeStateAndClaimGiftFunc(ctx, arg)
}

func (m *MockQuerier) UpdateInviteeStatus(ctx context.Context, arg UpdateInviteeStatusParams) (Invitee, error) {
	return m.UpdateInviteeStatusFunc(ctx, arg)
}

func (m *MockQuerier) UpdateOrderStatus(ctx context.Context, arg UpdateOrderStatusParams) (Order, error) {
	return m.UpdateOrderStatusFunc(ctx, arg)
}
