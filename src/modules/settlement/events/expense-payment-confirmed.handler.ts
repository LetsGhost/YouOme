import { EventHandler } from "../../common/messaging/event-handler";
import { PaymentConfirmedEvent } from "../../expense-participant/events/payment-confirmed.event";
import { settlementService } from "../service/settlement.service";

/**
 * When an expense-participant share is confirmed - whether via the bulk
 * settlement "approve" action or an individual per-expense confirm - any
 * open settlement bundling that expense needs its live remaining balance
 * recomputed (see SettlementService.recomputeAmount for why this can also
 * increase, not just decrease).
 */
export class SettlementRecomputeOnConfirmHandler extends EventHandler<PaymentConfirmedEvent> {
  getEventType(): string {
    return "expense-participant.payment_confirmed";
  }

  async handle(event: PaymentConfirmedEvent): Promise<void> {
    const settlements = await settlementService.findOpenBySourceExpense(event.payload.expenseId);
    for (const settlement of settlements) {
      await settlementService.recomputeAmount(settlement._id.toString());
    }
  }
}

export const settlementRecomputeOnConfirmHandler = new SettlementRecomputeOnConfirmHandler();
