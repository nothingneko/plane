import { Fragment } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import cycleService from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { CycleForm } from "components/cycles";
// helper
import { getDateRangeStatus } from "helpers/date-time.helper";
// types
import type { ICycle } from "types";
// fetch keys
import {
  CYCLE_COMPLETE_LIST,
  CYCLE_CURRENT_AND_UPCOMING_LIST,
  CYCLE_DRAFT_LIST,
} from "constants/fetch-keys";

type CycleModalProps = {
  isOpen: boolean;
  handleClose: () => void;
  data?: ICycle;
};

export const CreateUpdateCycleModal: React.FC<CycleModalProps> = ({
  isOpen,
  handleClose,
  data,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const dateChecker = async (startDate: string | null, endDate: string | null) => {
    if (!workspaceSlug || !projectId) return;

    if ((startDate === "" && endDate === "") || (!startDate && !endDate)) return true;

    const payload = {
      start_date: startDate ?? "",
      end_date: endDate ?? "",
    };

    await cycleService
      .cycleDateCheck(workspaceSlug as string, projectId as string, payload)
      .then((res) => res.status);
  };

  const createCycle = async (payload: Partial<ICycle>) => {
    await cycleService
      .createCycle(workspaceSlug as string, projectId as string, payload)
      .then((res) => {
        switch (getDateRangeStatus(res.start_date, res.end_date)) {
          case "completed":
            mutate(CYCLE_COMPLETE_LIST(projectId as string));
            break;
          case "current":
            mutate(CYCLE_CURRENT_AND_UPCOMING_LIST(projectId as string));
            break;
          case "upcoming":
            mutate(CYCLE_CURRENT_AND_UPCOMING_LIST(projectId as string));
            break;
          default:
            mutate(CYCLE_DRAFT_LIST(projectId as string));
        }
        handleClose();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Cycle created successfully.",
        });
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Error in creating cycle. Please try again.",
        });
      });
  };

  const updateCycle = async (cycleId: string, payload: Partial<ICycle>) => {
    await cycleService
      .updateCycle(workspaceSlug as string, projectId as string, cycleId, payload)
      .then((res) => {
        switch (getDateRangeStatus(data?.start_date, data?.end_date)) {
          case "completed":
            mutate(CYCLE_COMPLETE_LIST(projectId as string));
            break;
          case "current":
            mutate(CYCLE_CURRENT_AND_UPCOMING_LIST(projectId as string));
            break;
          case "upcoming":
            mutate(CYCLE_CURRENT_AND_UPCOMING_LIST(projectId as string));
            break;
          default:
            mutate(CYCLE_DRAFT_LIST(projectId as string));
        }
        if (
          getDateRangeStatus(data?.start_date, data?.end_date) !=
          getDateRangeStatus(res.start_date, res.end_date)
        ) {
          switch (getDateRangeStatus(res.start_date, res.end_date)) {
            case "completed":
              mutate(CYCLE_COMPLETE_LIST(projectId as string));
              break;
            case "current":
              mutate(CYCLE_CURRENT_AND_UPCOMING_LIST(projectId as string));
              break;
            case "upcoming":
              mutate(CYCLE_CURRENT_AND_UPCOMING_LIST(projectId as string));
              break;
            default:
              mutate(CYCLE_DRAFT_LIST(projectId as string));
          }
        }

        handleClose();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Cycle updated successfully.",
        });
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Error in updating cycle. Please try again.",
        });
      });
  };

  const handleFormSubmit = async (formData: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<ICycle> = {
      ...formData,
    };

    const areDatesValid = await dateChecker(payload.start_date ?? "", payload.end_date ?? "");

    if (areDatesValid) {
      if (!data) await createCycle(payload);
      else await updateCycle(data.id, payload);
    } else
      setToastAlert({
        type: "error",
        title: "Error!",
        message:
          "You already have a cycle in the given date range, if you want to create a draft cycle you can do that by removing both the dates",
      });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-white px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <CycleForm
                  handleFormSubmit={handleFormSubmit}
                  handleClose={handleClose}
                  status={data ? true : false}
                  data={data}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
