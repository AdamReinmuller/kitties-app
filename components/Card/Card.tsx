import { BigNumberish } from "ethers";
import { formatEther } from "ethers/lib/utils";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { ReactNode, useCallback } from "react";
import { FaHashtag } from "react-icons/fa";
import { GiDna1, GiFemale, GiMale } from "react-icons/gi";
import { Button } from "../Ui";

type CardProps = {
  id: string;
  generation: string;
  isDam?: boolean;
  isSire?: boolean;
  owned?: boolean;
  price?: BigNumberish;
  handleParentSet?: (id: string, role: "dam" | "sire") => void;
  children?: ReactNode;
};

const Card = ({
  id,
  generation,
  children,
  handleParentSet,
  isDam,
  isSire,
  owned,
  price,
}: CardProps) => {
  const router = useRouter();

  const onNavigate = useCallback(() => {
    router.push(`/kitty/${id}`);
  }, [id, router]);

  return (
    <div className="relative flex flex-col justify-center gap-0.5 overflow-hidden rounded-md bg-rainbow p-0.5 shadow-xl">
      <>
        {isDam && <p className="pl-2 uppercase">Dam</p>}
        {isSire && <p className="pl-2 uppercase">Sire</p>}
        {owned && <p className="pl-2 uppercase">Owned</p>}
        {price && (
          <p className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full bg-teal-100 px-3 py-1 text-xl">
            {`Price ${formatEther(price)}`}
          </p>
        )}
      </>
      <motion.div
        whileHover={{ opacity: 1 }}
        transition={{
          duration: 0.3,
          ease: "linear",
        }}
        className="opacity-1 absolute top-0 left-0 z-10 flex h-full w-full flex-col items-center justify-end bg-black/75 p-4 md:opacity-0"
      >
        {handleParentSet && (
          <>
            <p className="text-5xl text-white">Breed as</p>
            <div className="flex">
              <motion.div
                onClick={() => handleParentSet(id, "dam")}
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.25, easings: "linear" }}
                className={`m-4 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full font-extrabold ${
                  isDam ? "bg-white" : "bg-black/60"
                }`}
              >
                <GiFemale className="h-1/2 w-1/2 text-teal-400" />
              </motion.div>
              <motion.div
                onClick={() => handleParentSet(id, "sire")}
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.25, easings: "linear" }}
                className={`m-4 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full font-extrabold ${
                  isSire ? "bg-white" : "bg-black/60"
                }`}
              >
                <GiMale className="h-1/2 w-1/2 text-teal-400" />
              </motion.div>
            </div>
          </>
        )}

        <Button onClick={onNavigate} className="mt-16 w-full bg-teal-500">
          Check Out
        </Button>
      </motion.div>

      <div className="flex items-center justify-center rounded-md ">
        <div className="flex flex-col rounded-md bg-white">{children}</div>
      </div>
      <div className="flex justify-between rounded-md bg-white px-2">
        <div className="flex items-center gap-1">
          <FaHashtag className="text-base" />
          <span className="text-2xl">{id}</span>
        </div>

        <div className="flex items-center gap-1 text-neutral-500">
          <GiDna1 className="text-xl" />
          <p>Gen</p>
          <span className="text-2xl">{generation}</span>
        </div>
      </div>
    </div>
  );
};

export default Card;
