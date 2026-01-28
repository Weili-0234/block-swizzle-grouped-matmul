export interface BlockCoord {
  m: number;
  n: number;
  id: number;
}

export const generateSchedule = (
  M: number,
  N: number,
  blockSizeM: number,
  blockSizeN: number,
  groupSizeM: number,
  mode: 'row-major' | 'grouped'
): BlockCoord[] => {
  const numPidM = Math.ceil(M / blockSizeM);
  const numPidN = Math.ceil(N / blockSizeN);
  const totalBlocks = numPidM * numPidN;
  
  const schedule: BlockCoord[] = [];

  for (let pid = 0; pid < totalBlocks; pid++) {
    let pid_m = 0;
    let pid_n = 0;

    if (mode === 'row-major') {
      // Standard Row-Major logic
      // Iterate N (columns) fast, M (rows) slow
      pid_m = Math.floor(pid / numPidN);
      pid_n = pid % numPidN;
    } else {
      // Triton Grouped Logic (from the blog)
      // num_pid_in_group = GROUP_SIZE_M * num_pid_n
      const num_pid_in_group = groupSizeM * numPidN;
      
      // group_id = pid // num_pid_in_group
      const group_id = Math.floor(pid / num_pid_in_group);
      
      // first_pid_m = group_id * GROUP_SIZE_M
      const first_pid_m = group_id * groupSizeM;
      
      // group_size_m = min(num_pid_m - first_pid_m, GROUP_SIZE_M)
      const current_group_size_m = Math.min(numPidM - first_pid_m, groupSizeM);
      
      // pid_m = first_pid_m + ((pid % num_pid_in_group) % group_size_m)
      pid_m = first_pid_m + ((pid % num_pid_in_group) % current_group_size_m);
      
      // pid_n = (pid % num_pid_in_group) // group_size_m
      pid_n = Math.floor((pid % num_pid_in_group) / current_group_size_m);
    }

    schedule.push({ m: pid_m, n: pid_n, id: pid });
  }

  return schedule;
};