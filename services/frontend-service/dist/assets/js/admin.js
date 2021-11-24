"use strict";

window.onload = async () => {
  let url = new URL(window.location.href);
  let password = url.searchParams.get("password");
  if (password != "ilovecats") return;
  let resp = await fetch("/api/admin");
  let data = await resp.json();
  addHats(data);
};

function addHats(data) {
  console.log(data);
  let arr = data.result;
  console.log(arr);

  for (let i = 0; i < arr.length; ++i) {
    let obj = arr[i];
    createElements(obj);
  }
}

function createElements(obj) {
  let row = document.createElement("div");
  row.classList.add("row", "mt-4");
  let hatCol = document.createElement("div");
  hatCol.classList.add("col-md-6", "d-flex", "align-items-center", "justify-content-center");
  let hatImg = document.createElement("img");
  hatImg.classList.add("img-fluid", "hat-img");
  hatImg.src = obj.Url;
  hatImg.alt = obj.Description;
  hatCol.appendChild(hatImg);
  let modCol = document.createElement("div");
  modCol.classList.add("col-md-6", "d-flex", "align-items-center", "justify-content-center");
  let modContainer = document.createElement("div");
  let hatName = document.createElement("h4");
  hatName.innerHTML = obj.Description;
  let approveLink = document.createElement("a");
  approveLink.innerHTML = "Approve";
  approveLink.href = `/api/admin/moderate?id=${obj.ID}&approve=true`;
  approveLink.setAttribute('target', '_blank');
  approveLink.classList.add("btn", "btn-success", "mr-2");
  let denyLink = document.createElement("a");
  denyLink.innerHTML = "Deny";
  denyLink.href = `/api/admin/moderate?id=${obj.ID}&approve=false`;
  denyLink.setAttribute('target', '_blank');
  denyLink.classList.add("btn", "btn-danger");
  modContainer.appendChild(hatName);
  modContainer.appendChild(approveLink);
  modContainer.appendChild(denyLink);
  modCol.appendChild(modContainer);
  row.appendChild(hatCol);
  row.appendChild(modCol);
  document.querySelector(".hat-items").appendChild(row);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2Fzc2V0cy9qcy9hZG1pbi5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJvbmxvYWQiLCJ1cmwiLCJVUkwiLCJsb2NhdGlvbiIsImhyZWYiLCJwYXNzd29yZCIsInNlYXJjaFBhcmFtcyIsImdldCIsInJlc3AiLCJmZXRjaCIsImRhdGEiLCJqc29uIiwiYWRkSGF0cyIsImNvbnNvbGUiLCJsb2ciLCJhcnIiLCJyZXN1bHQiLCJpIiwibGVuZ3RoIiwib2JqIiwiY3JlYXRlRWxlbWVudHMiLCJyb3ciLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjbGFzc0xpc3QiLCJhZGQiLCJoYXRDb2wiLCJoYXRJbWciLCJzcmMiLCJVcmwiLCJhbHQiLCJEZXNjcmlwdGlvbiIsImFwcGVuZENoaWxkIiwibW9kQ29sIiwibW9kQ29udGFpbmVyIiwiaGF0TmFtZSIsImlubmVySFRNTCIsImFwcHJvdmVMaW5rIiwiSUQiLCJzZXRBdHRyaWJ1dGUiLCJkZW55TGluayIsInF1ZXJ5U2VsZWN0b3IiXSwibWFwcGluZ3MiOiI7O0FBQUFBLE1BQU0sQ0FBQ0MsTUFBUCxHQUFnQixZQUFZO0FBRXhCLE1BQUlDLEdBQUcsR0FBRyxJQUFJQyxHQUFKLENBQVFILE1BQU0sQ0FBQ0ksUUFBUCxDQUFnQkMsSUFBeEIsQ0FBVjtBQUNBLE1BQUlDLFFBQVEsR0FBR0osR0FBRyxDQUFDSyxZQUFKLENBQWlCQyxHQUFqQixDQUFxQixVQUFyQixDQUFmO0FBRUEsTUFBSUYsUUFBUSxJQUFJLFdBQWhCLEVBQ0k7QUFFSixNQUFJRyxJQUFJLEdBQUcsTUFBTUMsS0FBSyxDQUFDLFlBQUQsQ0FBdEI7QUFDQSxNQUFJQyxJQUFJLEdBQUcsTUFBTUYsSUFBSSxDQUFDRyxJQUFMLEVBQWpCO0FBQ0FDLEVBQUFBLE9BQU8sQ0FBQ0YsSUFBRCxDQUFQO0FBQ0gsQ0FYRDs7QUFhQSxTQUFTRSxPQUFULENBQWlCRixJQUFqQixFQUF1QjtBQUNuQkcsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENB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QUFBQSxZQUFZLENBQUNGLFdBQWIsQ0FBeUJRLFFBQXpCO0FBQ0FQLEVBQUFBLE1BQU0sQ0FBQ0QsV0FBUCxDQUFtQkUsWUFBbkI7QUFFQWIsRUFBQUEsR0FBRyxDQUFDVyxXQUFKLENBQWdCTixNQUFoQjtBQUNBTCxFQUFBQSxHQUFHLENBQUNXLFdBQUosQ0FBZ0JDLE1BQWhCO0FBQ0FYLEVBQUFBLFFBQVEsQ0FBQ21CLGFBQVQsQ0FBdUIsWUFBdkIsRUFBcUNULFdBQXJDLENBQWlEWCxHQUFqRDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsid2luZG93Lm9ubG9hZCA9IGFzeW5jICgpID0+IHtcblxuICAgIGxldCB1cmwgPSBuZXcgVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICBsZXQgcGFzc3dvcmQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcInBhc3N3b3JkXCIpO1xuXG4gICAgaWYgKHBhc3N3b3JkICE9IFwiaWxvdmVjYXRzXCIpXG4gICAgICAgIHJldHVybjtcblxuICAgIGxldCByZXNwID0gYXdhaXQgZmV0Y2goXCIvYXBpL2FkbWluXCIpO1xuICAgIGxldCBkYXRhID0gYXdhaXQgcmVzcC5qc29uKCk7XG4gICAgYWRkSGF0cyhkYXRhKTtcbn1cblxuZnVuY3Rpb24gYWRkSGF0cyhkYXRhKSB7XG4gICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgbGV0IGFyciA9IGRhdGEucmVzdWx0O1xuICAgIGNvbnNvbGUubG9nKGFycik7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7ICsraSkge1xuICAgICAgICBsZXQgb2JqID0gYXJyW2ldO1xuICAgICAgICBjcmVhdGVFbGVtZW50cyhvYmopO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlRWxlbWVudHMob2JqKSB7XG4gICAgbGV0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgcm93LmNsYXNzTGlzdC5hZGQoXCJyb3dcIiwgXCJtdC00XCIpO1xuXG4gICAgbGV0IGhhdENvbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgaGF0Q29sLmNsYXNzTGlzdC5hZGQoXCJjb2wtbWQtNlwiLCBcImQtZmxleFwiLCBcImFsaWduLWl0ZW1zLWNlbnRlclwiLCBcImp1c3RpZnktY29udGVudC1jZW50ZXJcIik7XG4gICAgbGV0IGhhdEltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG4gICAgaGF0SW1nLmNsYXNzTGlzdC5hZGQoXCJpbWctZmx1aWRcIiwgXCJoYXQtaW1nXCIpO1xuICAgIGhhdEltZy5zcmMgPSBvYmouVXJsO1xuICAgIGhhdEltZy5hbHQgPSBvYmouRGVzY3JpcHRpb247XG4gICAgaGF0Q29sLmFwcGVuZENoaWxkKGhhdEltZyk7XG5cbiAgICBsZXQgbW9kQ29sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBtb2RDb2wuY2xhc3NMaXN0LmFkZChcImNvbC1tZC02XCIsIFwiZC1mbGV4XCIsIFwiYWxpZ24taXRlbXMtY2VudGVyXCIsIFwianVzdGlmeS1jb250ZW50LWNlbnRlclwiKTtcbiAgICBsZXQgbW9kQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBsZXQgaGF0TmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoNFwiKTtcbiAgICBoYXROYW1lLmlubmVySFRNTCA9IG9iai5EZXNjcmlwdGlvbjtcbiAgICBsZXQgYXBwcm92ZUxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICBhcHByb3ZlTGluay5pbm5lckhUTUwgPSBcIkFwcHJvdmVcIlxuICAgIGFwcHJvdmVMaW5rLmhyZWYgPSBgL2FwaS9hZG1pbi9tb2RlcmF0ZT9pZD0ke29iai5JRH0mYXBwcm92ZT10cnVlYDtcbiAgICBhcHByb3ZlTGluay5zZXRBdHRyaWJ1dGUoJ3RhcmdldCcsICdfYmxhbmsnKTtcbiAgICBhcHByb3ZlTGluay5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLXN1Y2Nlc3NcIiwgXCJtci0yXCIpO1xuXG4gICAgbGV0IGRlbnlMaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgZGVueUxpbmsuaW5uZXJIVE1MID0gXCJEZW55XCJcbiAgICBkZW55TGluay5ocmVmID0gYC9hcGkvYWRtaW4vbW9kZXJhdGU/aWQ9JHtvYmouSUR9JmFwcHJvdmU9ZmFsc2VgO1xuICAgIGRlbnlMaW5rLnNldEF0dHJpYnV0ZSgndGFyZ2V0JywgJ19ibGFuaycpO1xuICAgIGRlbnlMaW5rLmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4tZGFuZ2VyXCIpO1xuXG4gICAgbW9kQ29udGFpbmVyLmFwcGVuZENoaWxkKGhhdE5hbWUpO1xuICAgIG1vZENvbnRhaW5lci5hcHBlbmRDaGlsZChhcHByb3ZlTGluayk7XG4gICAgbW9kQ29udGFpbmVyLmFwcGVuZENoaWxkKGRlbnlMaW5rKTtcbiAgICBtb2RDb2wuYXBwZW5kQ2hpbGQobW9kQ29udGFpbmVyKTtcblxuICAgIHJvdy5hcHBlbmRDaGlsZChoYXRDb2wpO1xuICAgIHJvdy5hcHBlbmRDaGlsZChtb2RDb2wpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuaGF0LWl0ZW1zXCIpLmFwcGVuZENoaWxkKHJvdyk7XG59XG4iXX0=